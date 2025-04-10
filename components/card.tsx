import Link from 'next/link';

interface CardProps {
  title: string;
  description: string;
  href: string;
}

export default function Card({ title, description, href }: CardProps) {
  return (
    <Link
      href={href}
      className="block p-6 bg-white rounded-lg border border-gray-100 shadow-md hover:shadow-lg transition-shadow"
    >
      <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">{title}</h5>
      <p className="text-gray-700">{description}</p>
    </Link>
  );
} 