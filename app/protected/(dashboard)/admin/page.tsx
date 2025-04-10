import AdminWrapper from "./client-wrapper";

export default function AdminPage({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) {
  return <AdminWrapper searchParams={searchParams} />;
}
