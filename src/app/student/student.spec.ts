import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { StudentApiService } from './student-api.service';
import { Student } from './student';

describe('Student', () => {
  let component: Student;
  let fixture: ComponentFixture<Student>;
  let studentApiService: {
    addStudent: ReturnType<typeof vi.fn>;
    getAllStudents: ReturnType<typeof vi.fn>;
    getMyProfile: ReturnType<typeof vi.fn>;
    getStudentById: ReturnType<typeof vi.fn>;
    updateStudent: ReturnType<typeof vi.fn>;
    updateMyProfile: ReturnType<typeof vi.fn>;
    updateAcademicRecord: ReturnType<typeof vi.fn>;
    deleteStudent: ReturnType<typeof vi.fn>;
  };
  let authService: {
    backendStatus: ReturnType<typeof vi.fn>;
    role: ReturnType<typeof vi.fn>;
    session: ReturnType<typeof vi.fn>;
    warmupBackend: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    studentApiService = {
      addStudent: vi.fn(),
      getAllStudents: vi.fn(),
      getMyProfile: vi.fn(),
      getStudentById: vi.fn(),
      updateStudent: vi.fn(),
      updateMyProfile: vi.fn(),
      updateAcademicRecord: vi.fn(),
      deleteStudent: vi.fn(),
    };
    authService = {
      backendStatus: vi.fn(() => 'ready'),
      role: vi.fn(() => 'ADMIN'),
      session: vi.fn(() => ({ username: 'admin', role: 'ADMIN', token: 'token' })),
      warmupBackend: vi.fn(),
    };
    studentApiService.getAllStudents.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [Student],
      providers: [provideRouter([])],
    })
      .overrideProvider(StudentApiService, {
        useValue: studentApiService,
      })
      .overrideProvider(AuthService, {
        useValue: authService,
      })
      .compileComponents();

    fixture = TestBed.createComponent(Student);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function createComponentForRole(role: 'ADMIN' | 'TEACHER' | 'STUDENT'): Student {
    fixture.destroy();
    studentApiService.getAllStudents.mockClear();
    studentApiService.getMyProfile.mockClear();
    authService.role.mockReturnValue(role);
    authService.session.mockReturnValue({ username: role.toLowerCase(), role, token: 'token' });
    const roleFixture = TestBed.createComponent(Student);
    const roleComponent = roleFixture.componentInstance;
    roleFixture.detectChanges();
    return roleComponent;
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should save a student and show the list view', () => {
    studentApiService.addStudent.mockReturnValue(of({
      id: 1,
      name: 'Amina Yusuf',
      studentId: 'ST-101',
      username: 'amina',
      course: 'Computer Science',
      studentClass: 'CS-A',
      year: 'Year 2',
      status: 'Active',
      enrolledCourses: 'OOP, Database Systems',
      grade: 'A',
      attendancePercentage: 92,
    }));

    component.saveStudent({
      name: 'Amina Yusuf',
      studentId: 'ST-101',
      username: 'amina',
      course: 'Computer Science',
      studentClass: 'CS-A',
      year: 'Year 2',
      status: 'Active',
      enrolledCourses: 'OOP, Database Systems',
      grade: 'A',
      attendancePercentage: 92,
    });

    expect(studentApiService.addStudent).toHaveBeenCalled();
    expect(component.activeView).toBe('list');
  });

  it('should update an existing student', () => {
    component.students = [
      { id: 1, name: 'Amina Yusuf', studentId: 'ST-101', username: 'amina', course: 'Computer Science', studentClass: 'CS-A', year: 'Year 2', status: 'Active', enrolledCourses: 'OOP', grade: 'B+', attendancePercentage: 90 },
    ];
    component.editingId = 1;
    studentApiService.updateStudent.mockReturnValue(of({
      id: 1,
      name: 'Amina Yusuf',
      studentId: 'ST-101',
      username: 'amina',
      course: 'Software Engineering',
      studentClass: 'CS-A',
      year: 'Year 2',
      status: 'Active',
      enrolledCourses: 'OOP, Algorithms',
      grade: 'A-',
      attendancePercentage: 93,
    }));
    component.saveStudent({
      id: 1,
      name: 'Amina Yusuf',
      studentId: 'ST-101',
      username: 'amina',
      course: 'Software Engineering',
      studentClass: 'CS-A',
      year: 'Year 2',
      status: 'Active',
      enrolledCourses: 'OOP, Algorithms',
      grade: 'A-',
      attendancePercentage: 93,
    });

    expect(studentApiService.updateStudent).toHaveBeenCalledWith(1, {
      id: 1,
      name: 'Amina Yusuf',
      studentId: 'ST-101',
      username: 'amina',
      course: 'Software Engineering',
      studentClass: 'CS-A',
      year: 'Year 2',
      status: 'Active',
      enrolledCourses: 'OOP, Algorithms',
      grade: 'A-',
      attendancePercentage: 93,
    });
  });

  it('should delete a student', () => {
    studentApiService.deleteStudent.mockReturnValue(of(void 0));

    component.students = [
      { id: 1, name: 'Amina Yusuf', studentId: 'ST-101', username: 'amina', course: 'Computer Science', studentClass: 'CS-A', year: 'Year 2', status: 'Active', enrolledCourses: 'OOP', grade: 'A', attendancePercentage: 92 },
      { id: 2, name: 'Brian Mushi', studentId: 'ST-102', username: 'brian', course: 'Information Systems', studentClass: 'IS-B', year: 'Year 3', status: 'Deferred', enrolledCourses: 'Networks', grade: 'B', attendancePercentage: 85 },
    ];

    component.deleteStudent(1);

    expect(studentApiService.deleteStudent).toHaveBeenCalledWith(1);
    expect(component.students).toEqual([
      { id: 2, name: 'Brian Mushi', studentId: 'ST-102', username: 'brian', course: 'Information Systems', studentClass: 'IS-B', year: 'Year 3', status: 'Deferred', enrolledCourses: 'Networks', grade: 'B', attendancePercentage: 85 },
    ]);
  });

  it('should block non-admin users from deleting students', () => {
    const teacherComponent = createComponentForRole('TEACHER');
    teacherComponent.deleteStudent(1);
    expect(studentApiService.deleteStudent).not.toHaveBeenCalled();
    expect(teacherComponent.errorMessage).toBe('Only admins can delete student profiles.');
  });

  it('should summarize students per course for analytics', () => {
    component.students = [
      { id: 1, name: 'Amina Yusuf', studentId: 'ST-101', username: 'amina', course: 'Computer Science', studentClass: 'CS-A', year: 'Year 2', status: 'Active', enrolledCourses: 'OOP', grade: 'A', attendancePercentage: 92 },
      { id: 2, name: 'Brian Mushi', studentId: 'ST-102', username: 'brian', course: 'Computer Science', studentClass: 'CS-B', year: 'Year 3', status: 'Deferred', enrolledCourses: 'Algorithms', grade: 'B', attendancePercentage: 80 },
      { id: 3, name: 'Neema John', studentId: 'ST-103', username: 'neema', course: 'Information Systems', studentClass: 'IS-A', year: 'Year 1', status: 'Active', enrolledCourses: 'Databases', grade: 'A-', attendancePercentage: 95 },
    ];

    expect(component.totalStudents).toBe(3);
    expect(component.activeStudentsCount).toBe(2);
    expect(component.totalCourses).toBe(2);
    expect(component.studentsPerCourse).toEqual([
      { label: 'Computer Science', value: 2 },
      { label: 'Information Systems', value: 1 },
    ]);
  });

  it('should load only the student personal profile for student role', () => {
    studentApiService.getMyProfile.mockReturnValue(of({
      id: 1,
      name: 'Amina Yusuf',
      studentId: 'ST-101',
      username: 'student',
      course: 'Computer Science',
      studentClass: 'CS-A',
      year: 'Year 2',
      status: 'Active',
      enrolledCourses: 'OOP, Databases',
      grade: 'A',
      attendancePercentage: 94,
    }));
    const studentComponent = createComponentForRole('STUDENT');

    expect(studentApiService.getMyProfile).toHaveBeenCalled();
    expect(studentApiService.getAllStudents).not.toHaveBeenCalled();
    expect(studentComponent.activeView).toBe('profile');
    expect(studentComponent.ownProfile?.username).toBe('student');
  });
});
