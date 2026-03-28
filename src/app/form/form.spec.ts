import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormComponent } from './form';

describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit a normalized student record when adding a student', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.formModel = {
      name: '  Amina Yusuf  ',
      studentId: '  ST-101  ',
      username: '  Amina  ',
      course: '  Computer Science  ',
      studentClass: '  CS-A  ',
      year: '  Year 2  ',
      status: '  Active  ',
      enrolledCourses: '  OOP, Databases  ',
      grade: '  A  ',
      attendancePercentage: 120,
    };

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith({
      id: undefined,
      name: 'Amina Yusuf',
      studentId: 'ST-101',
      username: 'amina',
      course: 'Computer Science',
      studentClass: 'CS-A',
      year: 'Year 2',
      status: 'Active',
      enrolledCourses: 'OOP, Databases',
      grade: 'A',
      attendancePercentage: 100,
    });
    expect(component.validationMessage).toBe('');
  });

  it('should apply default values for optional add-student fields', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.formModel = {
      name: 'Brian Mushi',
      studentId: 'ST-102',
      username: 'brian',
      course: 'Information Systems',
      studentClass: 'IS-B',
      year: 'Year 1',
      status: 'Active',
      enrolledCourses: '   ',
      grade: '   ',
      attendancePercentage: Number.NaN,
    };

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith({
      id: undefined,
      name: 'Brian Mushi',
      studentId: 'ST-102',
      username: 'brian',
      course: 'Information Systems',
      studentClass: 'IS-B',
      year: 'Year 1',
      status: 'Active',
      enrolledCourses: 'Not assigned yet',
      grade: 'Pending',
      attendancePercentage: 0,
    });
  });

  it('should show validation and not emit when required add-student fields are missing', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.formModel = {
      name: '',
      studentId: '',
      username: '',
      course: '',
      studentClass: '',
      year: '',
      status: '',
      enrolledCourses: '',
      grade: '',
      attendancePercentage: 0,
    };

    component.submit();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(component.validationMessage).toBe('Fill in name, student ID, username, course, class, year, and status.');
  });
});
