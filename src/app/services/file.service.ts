import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { createClient } from "@supabase/supabase-js";


@Injectable({
  providedIn: 'root',
})
export class FileService {
  private readonly apiUrl = environment.apiUrl || '/api';
  private supabase;
  private readonly supabaseUrl = environment.supabaseUrl;
  private readonly supabaseKey = environment.supabaseKey;
  private readonly supabaseBucket = environment.supabaseBucket;

  constructor(private http: HttpClient) {
    this.supabase = createClient(
      this.supabaseUrl,
      this.supabaseKey,
      {
        auth: {
          persistSession: false,
        },
      },
    );
  }
  
  uploadFileToSupabase(file: File, folder: string): Promise<any> {
    const filePath = `${folder}/${Date.now()}-${file.name}`;
    return this.supabase.storage.from(this.supabaseBucket).upload(filePath, file);
  }

  uploadFile(file: File, folder: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return this.http.post<any>(`${this.apiUrl}/files`, formData).toPromise();
  }
}