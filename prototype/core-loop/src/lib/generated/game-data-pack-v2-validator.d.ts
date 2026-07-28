export interface GeneratedSchemaError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, unknown>;
  message?: string;
}
declare const validate: ((data: unknown) => boolean) & {
  errors?: GeneratedSchemaError[] | null;
};
export default validate;
