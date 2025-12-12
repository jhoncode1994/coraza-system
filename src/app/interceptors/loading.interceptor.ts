import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loadingMap = new Map<string, boolean>();
  private loadingCount = 0;

  get isLoading(): boolean {
    return this.loadingCount > 0;
  }

  setLoading(loading: boolean, url: string): void {
    if (loading) {
      this.loadingMap.set(url, loading);
      this.loadingCount++;
    } else {
      this.loadingMap.delete(url);
      this.loadingCount--;
    }
  }
}

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Iniciar loading
    this.loadingService.setLoading(true, req.url);

    return next.handle(req).pipe(
      finalize(() => {
        // Finalizar loading
        this.loadingService.setLoading(false, req.url);
      })
    );
  }
}
