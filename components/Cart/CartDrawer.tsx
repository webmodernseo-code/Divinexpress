'use client';

import { useCart } from './CartContext';
import { useToast } from '../Toast/ToastContext';
import styles from './CartDrawer.module.css';

export function CartDrawer() {
  const {
    cart,
    isOpen,
    subtotalCents,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();
  const { showToast } = useToast();

  const handleCheckout = () => {
    clearCart();
    closeCart();
    showToast('Commande confirmée — merci pour votre achat !');
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(cents / 100);
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayActive : ''}`}
        onClick={closeCart}
      />
      <div className={`${styles.drawer} ${isOpen ? styles.drawerActive : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Votre panier</h2>
          <button onClick={closeCart} className={styles.closeButton} aria-label="Fermer le panier">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.itemList}>
          {cart.length === 0 ? (
            <div className={styles.emptyState}>
              <span>Votre panier est vide.</span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.productId}-${item.size}-${item.color}`} className={styles.item}>
                <img src={item.image} alt={item.name} className={styles.itemImage} />
                <div className={styles.itemDetails}>
                  <h4 className={styles.itemName}>{item.name}</h4>
                  <span className={styles.itemOptions}>
                    Taille: {item.size} | Couleur: {item.color}
                  </span>
                  <div className={styles.qtyActions}>
                    <div className={styles.stepper}>
                      <button
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                        className={styles.stepButton}
                        aria-label="Diminuer"
                      >
                        -
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                        className={styles.stepButton}
                        aria-label="Augmenter"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId, item.size, item.color)}
                      className={styles.removeButton}
                      aria-label="Supprimer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <span className={styles.itemPrice}>{formatPrice(item.priceCents * item.quantity)}</span>
              </div>
            ))
          )}
        </div>

        <div className={styles.divider} />

        <div className={styles.footer}>
          <div className={styles.summaryRow}>
            <span>Sous-total</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          <button onClick={handleCheckout} className={styles.checkoutButton}>
            Passer la commande
          </button>
        </div>
      </div>
    </>
  );
}
export default CartDrawer;
