import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentRecord } from '../student/student.model';

@Component({
  selector: 'app-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './form.html',
  styleUrl: './form.css',
})
export class FormComponent implements OnChanges {
  @Input() student: StudentRecord | null = null;
  @Input() isSaving = false;
  @Output() save = new EventEmitter<StudentRecord>();
  @Output() cancel = new EventEmitter<void>();

  formModel: StudentRecord = this.createEmptyStudent();
  validationMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['student']) {
      this.formModel = this.student
        ? { ...this.student }
        : this.createEmptyStudent();
    }
  }

  submit(): void {
    this.validationMessage = '';

    const student = {
      id: this.formModel.id,
      name: this.formModel.name.trim(),
      studentId: this.formModel.studentId.trim(),
      username: this.formModel.username.trim().toLowerCase(),
      course: this.formModel.course.trim(),
      studentClass: this.formModel.studentClass.trim(),
      year: this.formModel.year.trim(),
      status: this.formModel.status.trim(),
      enrolledCourses: this.formModel.enrolledCourses.trim() || 'Not assigned yet',
      grade: this.formModel.grade.trim() || 'Pending',
      attendancePercentage: this.normalizeAttendance(this.formModel.attendancePercentage),
    };

    if (
      !student.name
      || !student.studentId
      || !student.username
      || !student.course
      || !student.studentClass
      || !student.year
      || !student.status
    ) {
      this.validationMessage = 'Fill in name, student ID, username, course, class, year, and status.';
      return;
    }

    this.save.emit(student);
  }

  onCancel(): void {
    this.validationMessage = '';
    this.formModel = this.student ? { ...this.student } : this.createEmptyStudent();
    this.cancel.emit();
  }

  get isEditing(): boolean {
    return this.student !== null;
  }

  private createEmptyStudent(): StudentRecord {
    return {
      name: '',
      studentId: '',
      username: '',
      course: '',
      studentClass: '',
      year: '',
      status: 'Active',
      enrolledCourses: '',
      grade: 'Pending',
      attendancePercentage: 0,
    };
  }

  private normalizeAttendance(attendancePercentage: number): number {
    if (Number.isNaN(attendancePercentage)) {
      return 0;
    }

    return Math.min(100, Math.max(0, attendancePercentage ?? 0));
  }
}
