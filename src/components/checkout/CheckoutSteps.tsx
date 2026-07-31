'use client';

import { useTranslations } from 'next-intl';

export type CheckoutStepPosition = 1 | 2 | 3;

const STEP_KEYS = ['shipping', 'payment', 'confirmation'] as const;
const TOTAL_STEPS = STEP_KEYS.length as CheckoutStepPosition;

type StepState = 'upcoming' | 'active' | 'done';

/**
 * Shared step indicator for the 3-page guest checkout tunnel
 * (Task 19 Shipping / Task 20 Payment / Task 21 Confirmation).
 *
 * Prop API is intentionally just `current` — kept stable for Tasks 20/21 to reuse as-is.
 *
 * State per badge position relative to `current`:
 * - position > current  -> "upcoming" (light gray fill, muted number)
 * - position < current  -> "done" (green fill, number stays visible — never a checkmark)
 * - position === current -> "active" (black fill, white number, halo ring) ...
 *   EXCEPT when `current` is the last step (3): the confirmation page shows the whole
 *   tunnel as complete, so the current badge renders "done" (green) instead of "active".
 *   This falls out of the same `current` prop — no extra prop needed for that case.
 */
function getStepState(position: number, current: CheckoutStepPosition): StepState {
  if (position < current) return 'done';
  if (position > current) return 'upcoming';
  return current === TOTAL_STEPS ? 'done' : 'active';
}

const BADGE_STATE_CLASSES: Record<StepState, string> = {
  upcoming: 'bg-mist-100 text-mist-500',
  active: 'bg-ink text-paper shadow-[0_0_0_4px_rgba(13,13,13,0.14)]',
  done: 'bg-success text-paper'
};

export function CheckoutSteps({ current }: { current: CheckoutStepPosition }) {
  const t = useTranslations('checkout.steps');

  return (
    <ol className="mb-8 flex items-center justify-center gap-1 sm:mb-11 sm:gap-2">
      {STEP_KEYS.map((key, index) => {
        const position = (index + 1) as CheckoutStepPosition;
        const state = getStepState(position, current);
        const isLast = position === TOTAL_STEPS;

        return (
          <li key={key} className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2.5">
              <span
                aria-current={position === current ? 'step' : undefined}
                className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-colors ${BADGE_STATE_CLASSES[state]}`}
              >
                {position}
              </span>
              <span
                className={`whitespace-nowrap text-xs font-bold tracking-wide ${
                  state === 'active' ? 'text-ink' : 'text-mist-500'
                } ${state === 'active' ? 'inline' : 'hidden sm:inline'}`}
              >
                {t(key)}
              </span>
            </div>
            {!isLast && <span aria-hidden="true" className="h-px w-5 flex-shrink-0 bg-mist-100 sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}
