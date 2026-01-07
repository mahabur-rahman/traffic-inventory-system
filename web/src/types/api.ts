export type ApiMeta = {
  requestId?: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
  meta?: ApiMeta;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;

  constructor(params: { code: string; message: string; status: number; requestId?: string }) {
    super(params.message);
    this.name = "ApiError";
    this.code = params.code;
    this.status = params.status;
    this.requestId = params.requestId;
  }
}
