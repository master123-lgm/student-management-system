import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { FormComponent } from '../form/form';
import { StudentApiService, StudentSearchFilters } from './student-api.service';
import { StudentAcademicUpdate, StudentProfileUpdate, StudentRecord } from './student.model';

type DashboardMenuItem = {
  title: string;
  description: string;
};

@Component({
  selector: 'app-student',
  imports: [CommonModule, FormsModule, RouterLink, FormComponent],
  templateUrl: './student.html',
  styleUrl: './student.css',
})
export class Student implements OnInit {
  private readonly studentApiService = inject(StudentApiService);
  private readonly authService = inject(AuthService);
  private readonly requestTimeoutMs = 3000;

  activeView: 'profile' | 'form' | 'list' = 'list';
  selectedStudent: StudentRecord | null = null;
  editingId: number | null = null;
  students: StudentRecord[] = [];
  ownProfile: StudentRecord | null = null;
  ownProfileDraft: StudentProfileUpdate = this.createEmptyProfileDraft();
  academicDrafts: Record<number, StudentAcademicUpdate> = {};
  editingAcademicId: number | null = null;
  filters: StudentSearchFilters = {
    search: '',
    studentClass: '',
    year: '',
    status: '',
  };
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  isSaving = false;
  readonly session = this.authService.session;
  readonly backendStatus = this.authService.backendStatus;
  readonly role = computed(() => this.authService.role());
  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  readonly isTeacher = computed(() => this.role() === 'TEACHER');
  readonly isStudent = computed(() => this.role() === 'STUDENT');
  readonly canViewAllStudents = computed(() => this.isTeacher() || this.isAdmin());
  readonly canManageStudents = computed(() => this.isAdmin());
  readonly canManageAcademic = computed(() => this.isTeacher() || this.isAdmin());
  readonly canUseReports = computed(() => this.isTeacher() || this.isAdmin());
  readonly visibleMenuItems = computed<DashboardMenuItem[]>(() => {
    if (this.isStudent()) {
      return [
        { title: 'Profile', description: 'View and update only your own profile.' },
        { title: 'Grades', description: 'See your current results and academic standing.' },
        { title: 'Attendance', description: 'Track your attendance percentage.' },
      ];
    }

    if (this.isTeacher()) {
      return [
        { title: 'Students List', description: 'Review all student academic records.' },
        { title: 'Grade Form', description: 'Update grades, enrolled courses, and attendance.' },
      ];
    }

    return [
      { title: 'Full Dashboard', description: 'Access the complete admin dashboard.' },
      { title: 'Student Management', description: 'Add, edit, and delete student records.' },
      { title: 'Reports', description: 'View analytics and export system reports.' },
    ];
  });

  ngOnInit(): void {
    this.authService.warmupBackend();

    if (this.isStudent()) {
      this.activeView = 'profile';
      this.loadOwnProfile();
      return;
    }

    this.activeView = this.isAdmin() ? 'form' : 'list';
    this.loadStudents(this.filters);
  }

  setActiveView(view: 'profile' | 'form' | 'list'): void {
    if (view === 'profile' && !this.isStudent()) {
      return;
    }

    if (view === 'form' && !this.isAdmin()) {
      return;
    }

    if (view === 'list' && !this.canViewAllStudents()) {
      return;
    }

    this.activeView = view;
  }

  applyFilters(): void {
    if (!this.canViewAllStudents()) {
      return;
    }

    this.loadStudents(this.filters);
  }

  clearFilters(): void {
    this.successMessage = '';
    this.filters = {
      search: '',
      studentClass: '',
      year: '',
      status: '',
    };
    this.applyFilters();
  }

  saveStudent(student: StudentRecord): void {
    if (!this.isAdmin()) {
      this.errorMessage = 'Only admins can add or update student profiles.';
      return;
    }

    if (this.isBackendDown()) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSaving = true;

    const request = this.editingId === null
      ? this.studentApiService.addStudent(student)
      : this.studentApiService.updateStudent(this.editingId, student);

    request
      .pipe(
        timeout(this.requestTimeoutMs),
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: (savedStudent) => {
          const wasCreating = this.editingId === null;

          if (this.editingId === null) {
            this.students = [savedStudent, ...this.students.filter((existingStudent) => existingStudent.id !== savedStudent.id)];
            this.successMessage = 'Student saved successfully.';
          } else {
            this.students = this.students.map((existingStudent) =>
              existingStudent.id === savedStudent.id ? savedStudent : existingStudent,
            );
            this.successMessage = 'Student updated successfully.';
          }

          this.resetFormState();
          this.activeView = 'list';
          this.syncStudentsInBackground();

          if (wasCreating) {
            this.filters = {
              ...this.filters,
              search: '',
            };
          }
        },
        error: (error) => {
          this.successMessage = '';
          this.errorMessage = this.getErrorMessage(error, 'save student');
        },
      });
  }

  editStudent(id: number): void {
    if (!this.isAdmin()) {
      this.errorMessage = 'Only admins can update student profiles.';
      return;
    }

    if (this.isBackendDown()) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.studentApiService.getStudentById(id)
      .pipe(
        timeout(this.requestTimeoutMs),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (student) => {
          this.editingId = id;
          this.selectedStudent = student;
          this.activeView = 'form';
        },
        error: (error) => {
          this.errorMessage = this.getErrorMessage(error, 'load student details');
        },
      });
  }

  deleteStudent(id: number): void {
    if (!this.isAdmin()) {
      this.errorMessage = 'Only admins can delete student profiles.';
      return;
    }

    if (this.isBackendDown()) {
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.studentApiService.deleteStudent(id)
      .pipe(
        timeout(this.requestTimeoutMs),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.students = this.students.filter((student) => student.id !== id);
          this.successMessage = 'Student deleted successfully.';
          if (this.editingId === id) {
            this.resetFormState();
          }
        },
        error: (error) => {
          this.successMessage = '';
          this.errorMessage = this.getErrorMessage(error, 'delete student');
        },
      });
  }

  beginAcademicEdit(student: StudentRecord): void {
    if (!this.canManageAcademic()) {
      return;
    }

    if (student.id === undefined) {
      return;
    }

    this.editingAcademicId = student.id;
    this.academicDrafts[student.id] = {
      enrolledCourses: student.enrolledCourses,
      grade: student.grade,
      attendancePercentage: student.attendancePercentage,
    };
  }

  cancelAcademicEdit(): void {
    this.editingAcademicId = null;
  }

  saveAcademicRecord(id: number): void {
    if (!this.canManageAcademic()) {
      this.errorMessage = 'Only teachers or admins can manage academic records.';
      return;
    }

    if (this.isBackendDown()) {
      return;
    }

    const draft = this.academicDrafts[id];

    if (!draft) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSaving = true;

    this.studentApiService.updateAcademicRecord(id, draft)
      .pipe(
        timeout(this.requestTimeoutMs),
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: (updatedStudent) => {
          this.students = this.students.map((student) => student.id === id ? updatedStudent : student);
          this.editingAcademicId = null;
          this.successMessage = 'Academic record saved successfully.';
        },
        error: (error) => {
          this.successMessage = '';
          this.errorMessage = this.getErrorMessage(error, 'save academic record');
        },
      });
  }

  saveOwnProfile(): void {
    if (!this.isStudent()) {
      return;
    }

    if (this.isBackendDown()) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSaving = true;

    this.studentApiService.updateMyProfile(this.ownProfileDraft)
      .pipe(
        timeout(this.requestTimeoutMs),
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: (student) => {
          this.ownProfile = student;
          this.ownProfileDraft = this.mapProfileDraft(student);
          this.successMessage = 'Profile updated successfully.';
        },
        error: (error) => {
          this.successMessage = '';
          this.errorMessage = this.getErrorMessage(error, 'update your profile');
        },
      });
  }

  downloadTranscript(): void {
    const student = this.ownProfile;

    if (!student) {
      this.errorMessage = 'Your profile is not available yet.';
      return;
    }

    const transcriptWindow = window.open('', '_blank', 'width=900,height=700');

    if (!transcriptWindow) {
      this.errorMessage = 'Allow pop-ups in the browser to download the transcript.';
      return;
    }

    transcriptWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Transcript</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
            .card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 20px; }
            h1 { margin-top: 0; }
            p { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Student Transcript</h1>
            <p><strong>Name:</strong> ${this.escapeHtml(student.name)}</p>
            <p><strong>Student ID:</strong> ${this.escapeHtml(student.studentId)}</p>
            <p><strong>Username:</strong> ${this.escapeHtml(student.username)}</p>
            <p><strong>Course:</strong> ${this.escapeHtml(student.course)}</p>
            <p><strong>Enrolled Courses:</strong> ${this.escapeHtml(student.enrolledCourses)}</p>
            <p><strong>Grade / Result:</strong> ${this.escapeHtml(student.grade)}</p>
            <p><strong>Attendance:</strong> ${student.attendancePercentage}%</p>
            <p><strong>Status:</strong> ${this.escapeHtml(student.status)}</p>
          </div>
        </body>
      </html>
    `);
    transcriptWindow.document.close();
    transcriptWindow.focus();
    transcriptWindow.print();
  }

  exportExcelReport(): void {
    if (!this.canUseReports()) {
      return;
    }

    if (!this.students.length) {
      this.errorMessage = 'There are no students to export.';
      return;
    }

    const header = ['Name', 'Student ID', 'Username', 'Course', 'Class', 'Year', 'Status', 'Grade', 'Attendance', 'Enrolled Courses'];
    const rows = this.students.map((student) => [
      student.name,
      student.studentId,
      student.username,
      student.course,
      student.studentClass,
      student.year,
      student.status,
      student.grade,
      `${student.attendancePercentage}%`,
      student.enrolledCourses,
    ]);
    const csvContent = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = fileUrl;
    anchor.download = `student-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(fileUrl);
  }

  exportPdfReport(): void {
    if (!this.canUseReports()) {
      return;
    }

    if (!this.students.length) {
      this.errorMessage = 'There are no students to export.';
      return;
    }

    const reportWindow = window.open('', '_blank', 'width=1080,height=720');

    if (!reportWindow) {
      this.errorMessage = 'Allow pop-ups in the browser to export the PDF report.';
      return;
    }

    const rows = this.students.map((student) => `
      <tr>
        <td>${this.escapeHtml(student.name)}</td>
        <td>${this.escapeHtml(student.studentId)}</td>
        <td>${this.escapeHtml(student.course)}</td>
        <td>${this.escapeHtml(student.grade)}</td>
        <td>${student.attendancePercentage}%</td>
      </tr>
    `).join('');

    const courseSummary = this.studentsPerCourse.map((entry) => `<li>${this.escapeHtml(entry.label)}: ${entry.value}</li>`).join('');

    reportWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Student Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
            h1, h2 { margin-bottom: 8px; }
            .stats { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 12px; margin-bottom: 24px; }
            .stat { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #e2e8f0; }
          </style>
        </head>
        <body>
          <h1>Academic Report</h1>
          <div class="stats">
            <div class="stat"><strong>Total Students</strong><div>${this.totalStudents}</div></div>
            <div class="stat"><strong>Active</strong><div>${this.activeStudentsCount}</div></div>
            <div class="stat"><strong>Courses</strong><div>${this.totalCourses}</div></div>
            <div class="stat"><strong>Filtered Results</strong><div>${this.students.length}</div></div>
          </div>
          <h2>Students Per Course</h2>
          <ul>${courseSummary}</ul>
          <h2>Student Performance</h2>
          <table>
            <thead><tr><th>Name</th><th>Student ID</th><th>Course</th><th>Grade</th><th>Attendance</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  }

  cancelEdit(): void {
    this.successMessage = '';
    this.resetFormState();
    this.activeView = this.students.length ? 'list' : 'form';
  }

  trackStudent(_: number, student: StudentRecord): number | string {
    return student.id ?? student.studentId;
  }

  get totalStudents(): number {
    return this.students.length;
  }

  get totalCourses(): number {
    return new Set(this.students.map((student) => student.course)).size;
  }

  get activeStudentsCount(): number {
    return this.countByStatus('Active');
  }

  get deferredStudentsCount(): number {
    return this.countByStatus('Deferred');
  }

  get studentsPerCourse(): Array<{ label: string; value: number }> {
    const totals = new Map<string, number>();

    for (const student of this.students) {
      totals.set(student.course, (totals.get(student.course) ?? 0) + 1);
    }

    return [...totals.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([label, value]) => ({ label, value }));
  }

  private loadStudents(filters: StudentSearchFilters): void {
    if (!this.canViewAllStudents()) {
      return;
    }

    if (this.isBackendDown()) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.studentApiService.getAllStudents(filters)
      .pipe(
        timeout(this.requestTimeoutMs),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (students) => {
          this.students = students;
        },
        error: (error) => {
          this.errorMessage = this.getErrorMessage(error, 'load students');
        },
      });
  }

  private syncStudentsInBackground(): void {
    if (!this.canViewAllStudents()) {
      return;
    }

    this.studentApiService.getAllStudents(this.filters)
      .pipe(timeout(this.requestTimeoutMs))
      .subscribe({
        next: (students) => {
          this.students = students;
        },
        error: () => {
          // Keep the immediate local state if the background refresh fails.
        },
      });
  }

  private loadOwnProfile(): void {
    if (this.isBackendDown()) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.studentApiService.getMyProfile()
      .pipe(
        timeout(this.requestTimeoutMs),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (student) => {
          this.ownProfile = student;
          this.ownProfileDraft = this.mapProfileDraft(student);
        },
        error: (error) => {
          this.errorMessage = this.getErrorMessage(error, 'load your profile');
        },
      });
  }

  private createEmptyProfileDraft(): StudentProfileUpdate {
    return {
      name: '',
      course: '',
      studentClass: '',
      year: '',
      enrolledCourses: '',
    };
  }

  private mapProfileDraft(student: StudentRecord): StudentProfileUpdate {
    return {
      name: student.name,
      course: student.course,
      studentClass: student.studentClass,
      year: student.year,
      enrolledCourses: student.enrolledCourses,
    };
  }

  private resetFormState(): void {
    this.editingId = null;
    this.selectedStudent = null;
  }

  private countByStatus(status: string): number {
    return this.students.filter((student) => student.status.toLowerCase() === status.toLowerCase()).length;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private getErrorMessage(error: unknown, action: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Your session is not authorized. Login again to continue.';
      }

      if (error.status === 403) {
        return error.error?.message ?? 'You are not allowed to access this information.';
      }

      if (error.status === 409) {
        const backendMessage = error.error?.message;

        if (backendMessage === 'Student ID already exists') {
          return 'Student ID already exists. Use a different student ID.';
        }

        if (backendMessage === 'Username already exists') {
          return 'Username already exists. Use a different username.';
        }

        return backendMessage ?? `A duplicate record blocked the request while trying to ${action}.`;
      }

      if (error.status === 400) {
        return error.error?.message ?? `The submitted form data is invalid while trying to ${action}.`;
      }

      if (error.status === 0) {
        return 'Cannot reach backend at http://localhost:8080. Start the Spring Boot server and try again.';
      }

      return error.error?.message ?? `Backend returned ${error.status} while trying to ${action}.`;
    }

    return `Request timed out while trying to ${action}. Check that the backend is running.`;
  }

  private isBackendDown(): boolean {
    return false;
  }
}
