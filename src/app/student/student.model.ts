export type StudentRecord = {
  id?: number;
  name: string;
  studentId: string;
  username: string;
  course: string;
  studentClass: string;
  year: string;
  status: string;
  enrolledCourses: string;
  grade: string;
  attendancePercentage: number;
};

export type StudentProfileUpdate = {
  name: string;
  course: string;
  studentClass: string;
  year: string;
  enrolledCourses: string;
};

export type StudentAcademicUpdate = {
  enrolledCourses: string;
  grade: string;
  attendancePercentage: number;
};
