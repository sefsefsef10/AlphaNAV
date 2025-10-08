import { DocumentUpload } from "../document-upload";

export default function DocumentUploadExample() {
  return <DocumentUpload onUpload={(files) => console.log("Uploaded:", files)} />;
}
