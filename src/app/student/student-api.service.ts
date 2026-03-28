import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StudentAcademicUpdate, StudentProfileUpdate, StudentRecord } from './student.model';

@Injectable({
  providedIn: 'root',
})
export class StudentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/students';

  private readonly emptySearchFilters: StudentSearchFilters = {
    search: '',
    studentClass: '',
    year: '',
    status: '',
  };

  addStudent(student: StudentRecord): Observable<StudentRecord> {
    return this.http.post<StudentRecord>(this.apiUrl, student);
  }

  getAllStudents(filters: Partial<StudentSearchFilters> = this.emptySearchFilters): Observable<StudentRecord[]> {
    let params = new HttpParams();

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.studentClass?.trim()) {
      params = params.set('studentClass', filters.studentClass.trim());
    }

    if (filters.year?.trim()) {
      params = params.set('year', filters.year.trim());
    }

    if (filters.status?.trim()) {
      params = params.set('status', filters.status.trim());
    }

    return this.http.get<StudentRecord[]>(this.apiUrl, { params });
  }

  getStudentById(id: number): Observable<StudentRecord> {
    return this.http.get<StudentRecord>(`${this.apiUrl}/${id}`);
  }

  getMyProfile(): Observable<StudentRecord> {
    return this.http.get<StudentRecord>(`${this.apiUrl}/me`);
  }

  updateStudent(id: number, student: StudentRecord): Observable<StudentRecord> {
    return this.http.put<StudentRecord>(`${this.apiUrl}/${id}`, student);
  }

  updateMyProfile(student: StudentProfileUpdate): Observable<StudentRecord> {
    return this.http.put<StudentRecord>(`${this.apiUrl}/me`, student);
  }

  updateAcademicRecord(id: number, payload: StudentAcademicUpdate): Observable<StudentRecord> {
    return this.http.put<StudentRecord>(`${this.apiUrl}/${id}/academic`, payload);
  }

  deleteStudent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

export type StudentSearchFilters = {
  search: string;
  studentClass: string;
  year: string;
  status: string;
};
