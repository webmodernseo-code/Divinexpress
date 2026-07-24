import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DiscountCodeForm } from '@/components/Admin/DiscountCodeForm';
import { updateDiscountCode } from '../actions';
import styles from '../page.module.css';

export default async function EditDiscountCodePage({ params }: { params: { id: string } }) {
  const discountCode = await prisma.discountCode.findUnique({ where: { id: params.id } });
  if (!discountCode) notFound();

  const valueDisplay =
    discountCode.type === 'PERCENT' ? String(discountCode.value) : (discountCode.value / 100).toFixed(2);

  return (
    <div>
      <h1 className={styles.title}>Modifier {discountCode.code}</h1>
      <DiscountCodeForm
        action={updateDiscountCode.bind(null, discountCode.id)}
        initialValues={{
          code: discountCode.code,
          type: discountCode.type,
          valueDisplay,
          expiresAt: discountCode.expiresAt ? discountCode.expiresAt.toISOString().slice(0, 10) : ''
        }}
      />
    </div>
  );
}
