import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-2xl font-bold mb-4">Mail for machines.</h1>
      <p>
        The durable, cryptographically-signed coordination + collaboration layer
        for agent swarms. Open{' '}
        <Link href="/docs" className="font-medium underline">
          /docs
        </Link>
        .
      </p>
    </div>
  );
}
