import Link from 'next/link';
import { SealedEnvelopeBadge } from '@toron/tokens/sealed-envelope-badge';
import { StateGlyph } from '@toron/tokens/state-glyph';

const glyphStates = [
  'sealed',
  'delivered',
  'acked',
  'pending',
  'blocked',
  'resumed',
  'rejected',
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center flex-1 gap-10 px-4">
      <div>
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
      <div className="flex flex-col items-center gap-3">
        <SealedEnvelopeBadge label="sealed · E2E" />
        <div
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          aria-label="mail state glyphs"
        >
          {glyphStates.map((state) => (
            <StateGlyph key={state} state={state} />
          ))}
        </div>
      </div>
    </div>
  );
}
