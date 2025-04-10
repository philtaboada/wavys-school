export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl w-full mx-auto flex flex-col min-h-screen justify-center items-center">
      {children}
    </div>
  );
}
