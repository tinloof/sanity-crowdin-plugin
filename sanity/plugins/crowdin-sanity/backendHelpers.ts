export class InvalidRequestError {
  readonly _tag = "InvalidRequest";
  readonly response = {
    status: 400,
    body: { code: this._tag, message: "Invalid request" },
  } as const;
}
