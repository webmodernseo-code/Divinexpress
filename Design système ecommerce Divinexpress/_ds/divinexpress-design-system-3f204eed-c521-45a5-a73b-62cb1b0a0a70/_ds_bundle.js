/* @ds-bundle: {"format":4,"namespace":"DivinExpressDesignSystem_3f204e","components":[{"name":"Card","sourcePath":"components/data/Card.jsx"},{"name":"ProductCard","sourcePath":"components/data/ProductCard.jsx"},{"name":"Table","sourcePath":"components/data/Table.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"PriceTag","sourcePath":"components/feedback/PriceTag.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Dialog","sourcePath":"components/overlay/Dialog.jsx"}],"sourceHashes":{"components/data/Card.jsx":"b3638470c57e","components/data/ProductCard.jsx":"4f9fc6bfe288","components/data/Table.jsx":"138b20b6c200","components/feedback/Badge.jsx":"7d98302bd334","components/feedback/PriceTag.jsx":"e9d44b5c4635","components/feedback/Toast.jsx":"d30a6d809cfd","components/feedback/Tooltip.jsx":"91fc33902779","components/forms/Button.jsx":"ff0b9e9f831a","components/forms/Checkbox.jsx":"8c4aef7eeee0","components/forms/Input.jsx":"1f7c69df0921","components/forms/Select.jsx":"4671ce78c763","components/forms/Switch.jsx":"3a967a795e90","components/navigation/Breadcrumb.jsx":"499640e3a449","components/navigation/Tabs.jsx":"863b3f0bda7d","components/overlay/Dialog.jsx":"ef382ca61a53","ui_kits/dashboard/Analytics.jsx":"a5067cea5bcd","ui_kits/dashboard/Catalog.jsx":"b82c6df39d97","ui_kits/dashboard/DashboardShell.jsx":"019e778378de","ui_kits/dashboard/OrdersOverview.jsx":"fd28c7eaf826","ui_kits/dashboard/Settings.jsx":"850ada1ea222","ui_kits/dashboard/Sidebar.jsx":"bacea0131963","ui_kits/ecommerce/Cart.jsx":"6c843b0bae42","ui_kits/ecommerce/Checkout.jsx":"6f6d5d65276a","ui_kits/ecommerce/Footer.jsx":"e22e0e3efa8b","ui_kits/ecommerce/Header.jsx":"38769b5ae74f","ui_kits/ecommerce/Homepage.jsx":"1df3fd28db25","ui_kits/ecommerce/PDP.jsx":"13adc2bc9e03","ui_kits/ecommerce/PLP.jsx":"5f98aea61e33"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DivinExpressDesignSystem_3f204e = window.DivinExpressDesignSystem_3f204e || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data/Card.jsx
try { (() => {
/** Card — generic surface container, sharp corners, hairline border. */
function Card({
  children,
  padded = true,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--surface-border)',
      borderRadius: 'var(--radius-lg)',
      padding: padded ? 'var(--card-padding)' : 0,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/Table.jsx
try { (() => {
/** Table — dense dashboard data table with hairline row dividers. */
function Table({
  columns = [],
  rows = []
}) {
  return /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: 'var(--font-sans)',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c,
    style: {
      textAlign: 'left',
      padding: '10px 12px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      borderBottom: '1px solid var(--surface-divider)'
    }
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((row, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, row.map((cell, j) => /*#__PURE__*/React.createElement("td", {
    key: j,
    style: {
      padding: '12px 12px',
      borderBottom: '1px solid var(--surface-divider)',
      color: 'var(--text-primary)'
    }
  }, cell))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Table.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
/** Badge — small status pill. `tone` maps to semantic status colors. */
function Badge({
  tone = 'neutral',
  children
}) {
  const map = {
    success: {
      bg: 'var(--status-success-bg)',
      fg: 'var(--status-success-fg)'
    },
    danger: {
      bg: 'var(--status-danger-bg)',
      fg: 'var(--status-danger-fg)'
    },
    lowStock: {
      bg: 'var(--status-low-stock-bg)',
      fg: 'var(--status-low-stock-fg)'
    },
    neutral: {
      bg: 'var(--status-neutral-bg)',
      fg: 'var(--status-neutral-fg)'
    },
    new: {
      bg: 'var(--status-new-bg)',
      fg: 'var(--status-new-fg)'
    },
    promo: {
      bg: 'var(--badge-promo-bg)',
      fg: 'var(--badge-promo-fg)'
    }
  };
  const c = map[tone] || map.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      padding: '4px 10px',
      borderRadius: 'var(--radius-pill)',
      background: c.bg,
      color: c.fg,
      border: tone === 'promo' ? '1px solid var(--badge-promo-border)' : 'none'
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/PriceTag.jsx
try { (() => {
/**
 * PriceTag — commerce price display. When `salePrice` is given, the regular
 * price shows struck-through in grey and the sale price renders in promo green.
 */
function PriceTag({
  price,
  salePrice,
  size = 'md',
  currency = '€'
}) {
  const big = size === 'lg';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 10,
      fontFamily: 'var(--font-sans)'
    }
  }, salePrice ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: big ? 'var(--price-lg-size)' : 'var(--price-size)',
      color: 'var(--price-sale)'
    }
  }, currency, salePrice), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: big ? 18 : 14,
      color: 'var(--price-strike)',
      textDecoration: 'line-through'
    }
  }, currency, price)) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: big ? 'var(--price-lg-size)' : 'var(--price-size)',
      color: 'var(--price-regular)'
    }
  }, currency, price));
}
Object.assign(__ds_scope, { PriceTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/PriceTag.jsx", error: String((e && e.message) || e) }); }

// components/data/ProductCard.jsx
try { (() => {
/**
 * ProductCard — storefront product tile. `variant="editorial"` is image-led
 * with overlaid badge and minimal caption; `variant="compact"` is a tighter
 * grid tile with info stacked below the image (used in dense PLP grids).
 */
function ProductCard({
  name,
  category,
  price,
  salePrice,
  badge,
  variant = 'editorial'
}) {
  const [hover, setHover] = React.useState(false);
  const imgBlock = /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '1/1',
      background: 'var(--surface-sunken)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase'
    }
  }, "Product image"), badge && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: badge.tone
  }, badge.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: hover ? 'rgba(10,10,10,0.04)' : 'transparent',
      transition: 'background var(--duration-base) var(--ease-standard)'
    }
  }));
  if (variant === 'compact') {
    return /*#__PURE__*/React.createElement("div", {
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: {
        fontFamily: 'var(--font-sans)',
        cursor: 'pointer'
      }
    }, imgBlock, /*#__PURE__*/React.createElement("div", {
      style: {
        paddingTop: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600
      }
    }, name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)',
        marginBottom: 6
      }
    }, category), /*#__PURE__*/React.createElement(__ds_scope.PriceTag, {
      price: price,
      salePrice: salePrice
    })));
  }
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      fontFamily: 'var(--font-sans)',
      cursor: 'pointer'
    }
  }, imgBlock, /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 14,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, category)), /*#__PURE__*/React.createElement(__ds_scope.PriceTag, {
    price: price,
    salePrice: salePrice
  })));
}
Object.assign(__ds_scope, { ProductCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProductCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
/** Toast — transient confirmation message, slides up from bottom. */
function Toast({
  message,
  tone = 'default',
  visible = true
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: visible ? 'flex' : 'none',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 500,
      padding: '14px 20px',
      borderRadius: 'var(--radius-md)',
      background: tone === 'error' ? 'var(--color-black)' : 'var(--color-black)',
      color: '#fff',
      boxShadow: 'var(--shadow-lg)',
      maxWidth: 360
    }
  }, tone === 'error' ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--color-red-500)',
      flexShrink: 0
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: 'var(--color-green-500)',
      flexShrink: 0
    }
  }), message);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
/** Tooltip — small dark label shown above an anchor, wraps its child. */
function Tooltip({
  label,
  children
}) {
  const [open, setOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-block'
    },
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false)
  }, children, open && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      transform: 'translate(-50%, -6px)',
      background: 'var(--color-black)',
      color: '#fff',
      fontSize: 12,
      fontWeight: 500,
      padding: '6px 10px',
      borderRadius: 'var(--radius-sm)',
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-sans)',
      boxShadow: 'var(--shadow-md)',
      zIndex: 10
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizeStyles = {
  sm: {
    padding: '8px 16px',
    fontSize: 13
  },
  md: {
    padding: 'var(--control-padding-y) var(--control-padding-x)',
    fontSize: 14
  },
  lg: {
    padding: '16px 28px',
    fontSize: 15
  }
};
const base = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  letterSpacing: '0.01em',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid transparent',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard), transform var(--duration-instant) var(--ease-standard)',
  whiteSpace: 'nowrap'
};
const variants = {
  primary: {
    background: 'var(--action-primary-bg)',
    color: 'var(--action-primary-fg)',
    borderColor: 'var(--action-primary-bg)'
  },
  secondary: {
    background: 'var(--action-secondary-bg)',
    color: 'var(--action-secondary-fg)',
    borderColor: 'var(--action-secondary-border)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-primary)',
    borderColor: 'transparent'
  }
};

/**
 * Button — primary call-to-action control. Pill-shaped, uppercase-friendly,
 * three variants (primary/secondary/ghost), disabled state dims + blocks pointer.
 */
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  icon = null,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const v = variants[variant] || variants.primary;
  let bg = v.background;
  if (variant === 'primary') {
    if (active) bg = 'var(--action-primary-bg-active)';else if (hover) bg = 'var(--action-primary-bg-hover)';
  } else if (variant === 'secondary' && hover) {
    bg = 'var(--action-secondary-bg-hover)';
  }
  const disabledStyle = disabled ? {
    background: 'var(--action-disabled-bg)',
    color: 'var(--action-disabled-fg)',
    borderColor: 'var(--action-disabled-bg)',
    cursor: 'not-allowed'
  } : {};
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      ...base,
      ...sizeStyles[size],
      ...v,
      background: bg,
      ...disabledStyle,
      transform: active && !disabled ? 'scale(var(--press-scale))' : 'scale(1)',
      ...style
    }
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/** Checkbox — square, sharp corners, fills solid black when checked. */
function Checkbox({
  label,
  checked,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--text-primary)',
      cursor: 'pointer',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => onChange && onChange(!checked),
    style: {
      width: 18,
      height: 18,
      borderRadius: 'var(--radius-sm)',
      border: `1.5px solid ${checked ? 'var(--color-black)' : 'var(--surface-border-strong)'}`,
      background: checked ? 'var(--color-black)' : 'var(--surface-card)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)',
      flexShrink: 0
    }
  }, checked && /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "9",
    viewBox: "0 0 11 9",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 4.5L4 7.5L10 1",
    stroke: "white",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — single-line text field. Underline style by default (site), boxed
 * style available for dashboard density.
 */
function Input({
  label,
  placeholder,
  boxed = false,
  error,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-sans)',
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    placeholder: placeholder,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--text-primary)',
      padding: boxed ? '12px 14px' : '10px 2px',
      background: boxed ? 'var(--surface-sunken)' : 'transparent',
      border: boxed ? '1px solid var(--surface-border)' : 'none',
      borderBottom: boxed ? '1px solid var(--surface-border)' : `1px solid ${error ? 'var(--status-danger-fg)' : focused ? 'var(--color-black)' : 'var(--surface-border-strong)'}`,
      borderRadius: boxed ? 'var(--radius-md)' : 0,
      outline: 'none',
      boxShadow: focused && boxed ? 'var(--shadow-focus)' : 'none',
      transition: 'border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)'
    }
  }, rest)), error && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--status-danger-fg)'
    }
  }, error));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Select — dashboard-style dropdown, boxed by default. */
function Select({
  label,
  options = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-sans)',
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    onChange: onChange,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--text-primary)',
      padding: '10px 14px',
      background: 'var(--surface-card)',
      border: '1px solid var(--surface-border)',
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      cursor: 'pointer'
    }
  }, rest), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value ?? o,
    value: o.value ?? o
  }, o.label ?? o))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** Switch — pill toggle for dashboard settings. */
function Switch({
  checked,
  onChange,
  label,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      cursor: 'pointer',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => onChange && onChange(!checked),
    style: {
      width: 40,
      height: 24,
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--color-black)' : 'var(--color-ink-200)',
      position: 'relative',
      transition: 'background var(--duration-fast) var(--ease-standard)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: checked ? 19 : 3,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'var(--shadow-xs)',
      transition: 'left var(--duration-fast) var(--ease-standard)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-primary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
/** Breadcrumb — small caps trail with slash separators. */
function Breadcrumb({
  items = []
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.03em',
      textTransform: 'uppercase'
    }
  }, items.map((item, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: item
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: i === items.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)'
    }
  }, item))));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/** Tabs — underline-style tab switcher. */
function Tabs({
  items = [],
  active,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 28,
      borderBottom: '1px solid var(--surface-divider)',
      fontFamily: 'var(--font-sans)'
    }
  }, items.map(item => {
    const isActive = item === active;
    return /*#__PURE__*/React.createElement("button", {
      key: item,
      onClick: () => onChange && onChange(item),
      style: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '12px 2px',
        fontSize: 14,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
        borderBottom: `2px solid ${isActive ? 'var(--color-black)' : 'transparent'}`,
        marginBottom: -1,
        transition: 'color var(--duration-fast) var(--ease-standard)'
      }
    }, item);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Dialog.jsx
try { (() => {
/** Dialog — centered modal with scrim, used for confirmations. */
function Dialog({
  open,
  title,
  children,
  onClose
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--surface-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      padding: 28,
      width: 380,
      boxShadow: 'var(--shadow-lg)',
      fontFamily: 'var(--font-sans)'
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      marginBottom: 16
    }
  }, title), children));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Dialog.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Analytics.jsx
try { (() => {
function Analytics({
  Card,
  Select
}) {
  const bars = [40, 55, 35, 70, 60, 85, 50];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 180
    }
  }, /*#__PURE__*/React.createElement(Select, {
    options: ['Last 7 days', 'Last 30 days', 'This year']
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Total revenue"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 800,
      marginTop: 8
    }
  }, "\u20AC42,180"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--price-sale)',
      marginTop: 6
    }
  }, "\u2191 12.4% vs last period")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Conversion rate"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 800,
      marginTop: 8
    }
  }, "3.8%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--price-sale)',
      marginTop: 6
    }
  }, "\u2191 0.4pt")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "Returns"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 800,
      marginTop: 8
    }
  }, "2.1%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--status-danger-fg)',
      marginTop: 6
    }
  }, "\u2191 0.2pt"))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      marginBottom: 20
    }
  }, "Revenue by day"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 16,
      height: 160
    }
  }, bars.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: h * 1.6,
      background: 'var(--color-black)',
      borderRadius: '2px 2px 0 0'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, days[i]))))));
}
window.Analytics = Analytics;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Analytics.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Catalog.jsx
try { (() => {
const products = [{
  name: 'Air Runner 2',
  category: "Men's Shoes",
  price: '€150.00',
  stock: 42,
  status: 'success',
  label: 'Active'
}, {
  name: 'Flex Trainer',
  category: "Men's Shoes",
  price: '€120.00',
  stock: 6,
  status: 'lowStock',
  label: 'Low stock'
}, {
  name: 'Court Legacy',
  category: "Women's Shoes",
  price: '€89.00',
  stock: 118,
  status: 'success',
  label: 'Active'
}, {
  name: 'Sprint Tee',
  category: "Men's Tops",
  price: '€45.00',
  stock: 0,
  status: 'danger',
  label: 'Out of stock'
}, {
  name: 'Studio Slip',
  category: "Women's Shoes",
  price: '€75.00',
  stock: 31,
  status: 'success',
  label: 'Active'
}];
function Catalog({
  Card,
  Table,
  Badge,
  Button,
  Input
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 280
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Search products\u2026",
    boxed: true
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "Add Product")), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px 8px'
    }
  }, /*#__PURE__*/React.createElement(Table, {
    columns: ['Product', 'Category', 'Price', 'Stock', 'Status'],
    rows: products.map(p => [/*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 32,
        height: 32,
        background: 'var(--surface-sunken)',
        borderRadius: 4,
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600
      }
    }, p.name)), p.category, p.price, p.stock, /*#__PURE__*/React.createElement(Badge, {
      tone: p.status
    }, p.label)])
  }))));
}
window.Catalog = Catalog;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Catalog.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/DashboardShell.jsx
try { (() => {
function DashboardShell({
  title,
  actions,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--surface-sunken)',
      minHeight: '100%',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '28px 40px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      letterSpacing: '-0.01em'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, actions)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 40px 48px'
    }
  }, children));
}
window.DashboardShell = DashboardShell;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/DashboardShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/OrdersOverview.jsx
try { (() => {
const orders = [{
  id: '#1042',
  customer: 'A. Dubois',
  status: 'success',
  label: 'Fulfilled',
  total: '€149.00'
}, {
  id: '#1041',
  customer: 'L. Martin',
  status: 'lowStock',
  label: 'Backordered',
  total: '€89.00'
}, {
  id: '#1040',
  customer: 'S. Bernard',
  status: 'success',
  label: 'Fulfilled',
  total: '€212.50'
}, {
  id: '#1039',
  customer: 'J. Petit',
  status: 'danger',
  label: 'Payment failed',
  total: '€64.00'
}, {
  id: '#1038',
  customer: 'M. Rousseau',
  status: 'neutral',
  label: 'Processing',
  total: '€99.00'
}];
function OrdersOverview({
  Card,
  Table,
  Badge,
  Button
}) {
  const stats = [{
    label: 'Orders today',
    value: '48'
  }, {
    label: 'Revenue today',
    value: '€6,204'
  }, {
    label: 'Avg. order value',
    value: '€129'
  }, {
    label: 'Backordered',
    value: '3',
    tone: 'lowStock'
  }];
  return /*#__PURE__*/React.createElement(DashboardShellContent, {
    Card: Card,
    Table: Table,
    Badge: Badge,
    Button: Button,
    stats: stats
  });
}
function DashboardShellContent({
  Card,
  Table,
  Badge,
  Button,
  stats
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 16,
      marginBottom: 24
    }
  }, stats.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.label
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, s.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 800,
      marginTop: 8,
      color: s.tone === 'lowStock' ? 'var(--status-low-stock-fg)' : 'var(--text-primary)'
    }
  }, s.value)))), /*#__PURE__*/React.createElement(Card, {
    padded: false
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid var(--surface-divider)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700
    }
  }, "Recent Orders"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "View all")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 20px 8px'
    }
  }, /*#__PURE__*/React.createElement(Table, {
    columns: ['Order', 'Customer', 'Status', 'Total'],
    rows: orders.map(o => [o.id, o.customer, /*#__PURE__*/React.createElement(Badge, {
      tone: o.status
    }, o.label), o.total])
  }))));
}
window.OrdersOverview = OrdersOverview;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/OrdersOverview.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Settings.jsx
try { (() => {
function Settings({
  Card,
  Input,
  Switch,
  Button
}) {
  const [notifs, setNotifs] = React.useState(true);
  const [lowStockAlert, setLowStockAlert] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 16
    }
  }, "Store details"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Store name",
    boxed: true,
    defaultValue: "DivinExpress"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Support email",
    boxed: true,
    defaultValue: "support@divinexpress.com"
  }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 16
    }
  }, "Notifications"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "Email me new orders",
    checked: notifs,
    onChange: setNotifs
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Alert me on low stock",
    checked: lowStockAlert,
    onChange: setLowStockAlert
  }))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    style: {
      alignSelf: 'flex-start'
    }
  }, "Save changes"));
}
window.Settings = Settings;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Settings.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Sidebar.jsx
try { (() => {
const nav = [{
  key: 'orders',
  label: 'Orders'
}, {
  key: 'catalog',
  label: 'Catalog'
}, {
  key: 'analytics',
  label: 'Analytics'
}, {
  key: 'settings',
  label: 'Settings'
}];
function Sidebar({
  page,
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 220,
      background: 'var(--color-black)',
      color: '#fff',
      height: '100%',
      padding: '24px 16px',
      fontFamily: 'var(--font-sans)',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 16,
      letterSpacing: '-0.01em',
      padding: '0 8px',
      marginBottom: 32
    }
  }, "DIVINEXPRESS"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.4)',
      padding: '0 8px',
      marginBottom: 8
    }
  }, "Store"), nav.map(n => /*#__PURE__*/React.createElement("div", {
    key: n.key,
    onClick: () => onNavigate(n.key),
    style: {
      padding: '10px 8px',
      borderRadius: 6,
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      background: page === n.key ? 'rgba(255,255,255,0.12)' : 'transparent',
      color: page === n.key ? '#fff' : 'rgba(255,255,255,0.7)'
    }
  }, n.label)));
}
window.Sidebar = Sidebar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ecommerce/Cart.jsx
try { (() => {
const items = [{
  name: 'Air Runner 2',
  variant: 'Size M / Black',
  price: 99,
  qty: 1
}, {
  name: 'Sprint Tee',
  variant: 'Size L / White',
  price: 29,
  qty: 2
}];
function Cart({
  PriceTag,
  Button,
  Input,
  onCheckout
}) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal > 50 ? 0 : 6;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      padding: '32px 32px 64px',
      display: 'flex',
      gap: 56
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 800,
      marginBottom: 24
    }
  }, "Your Bag"), items.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.name,
    style: {
      display: 'flex',
      gap: 16,
      padding: '20px 0',
      borderBottom: '1px solid var(--surface-divider)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 96,
      height: 96,
      background: 'var(--surface-sunken)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      color: 'var(--text-muted)',
      textAlign: 'center'
    }
  }, "Product image"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, it.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)',
      marginBottom: 8
    }
  }, it.variant), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, "Qty ", it.qty)), /*#__PURE__*/React.createElement(PriceTag, {
    price: it.price
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--surface-sunken)',
      padding: 24,
      alignSelf: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 16
    }
  }, "Order Summary"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 14,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, "Subtotal"), /*#__PURE__*/React.createElement("span", null, "\u20AC", subtotal.toFixed(2))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 14,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, "Shipping"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: shipping === 0 ? 'var(--price-sale)' : 'var(--text-primary)',
      fontWeight: 600
    }
  }, shipping === 0 ? 'Free' : `€${shipping.toFixed(2)}`)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      margin: '16px 0'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Promo code",
    boxed: true,
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, "Apply")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 18,
      fontWeight: 800,
      borderTop: '1px solid var(--surface-border)',
      paddingTop: 16,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", null, "Total"), /*#__PURE__*/React.createElement("span", null, "\u20AC", (subtotal + shipping).toFixed(2))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    style: {
      width: '100%'
    },
    onClick: onCheckout
  }, "Checkout")));
}
window.Cart = Cart;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ecommerce/Cart.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ecommerce/Checkout.jsx
try { (() => {
function Checkout({
  Input,
  Select,
  Button,
  PriceTag
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      padding: '32px 32px 64px',
      display: 'flex',
      gap: 56
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 800,
      marginBottom: 24
    }
  }, "Checkout"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: 16
    }
  }, "Shipping Address"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "First name",
    placeholder: "Camille",
    boxed: true
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Last name",
    placeholder: "Dubois",
    boxed: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Address",
    placeholder: "12 Rue de Rivoli",
    boxed: true
  })), /*#__PURE__*/React.createElement(Input, {
    label: "City",
    placeholder: "Paris",
    boxed: true
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Country",
    options: ['France', 'Belgium', 'Germany']
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: 16
    }
  }, "Payment"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Card number",
    placeholder: "0000 0000 0000 0000",
    boxed: true
  })), /*#__PURE__*/React.createElement(Input, {
    label: "Expiry",
    placeholder: "MM/YY",
    boxed: true
  }), /*#__PURE__*/React.createElement(Input, {
    label: "CVC",
    placeholder: "123",
    boxed: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--surface-sunken)',
      padding: 24,
      alignSelf: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 16
    }
  }, "Order Summary"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 14,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, "2 items"), /*#__PURE__*/React.createElement(PriceTag, {
    price: 157
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 14,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", null, "Shipping"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--price-sale)',
      fontWeight: 600
    }
  }, "Free")), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    style: {
      width: '100%'
    }
  }, "Place Order")));
}
window.Checkout = Checkout;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ecommerce/Checkout.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ecommerce/Footer.jsx
try { (() => {
function Footer() {
  const cols = [{
    title: 'Shop',
    links: ['New Arrivals', 'Men', 'Women', 'Kids', 'Sale']
  }, {
    title: 'Help',
    links: ['Order Status', 'Shipping', 'Returns', 'Contact Us']
  }, {
    title: 'About',
    links: ['Our Story', 'Sustainability', 'Careers']
  }];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: '1px solid var(--surface-divider)',
      padding: '56px 32px 32px',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 64,
      marginBottom: 40
    }
  }, cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.title,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: 4
    }
  }, c.title), c.links.map(l => /*#__PURE__*/React.createElement("span", {
    key: l,
    style: {
      fontSize: 13,
      color: 'var(--text-secondary)',
      cursor: 'pointer'
    }
  }, l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, "\xA9 2026 DivinExpress, Inc. All rights reserved."));
}
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ecommerce/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ecommerce/Header.jsx
try { (() => {
function Header({
  page,
  onNavigate,
  cartCount = 2
}) {
  const nav = ['New', 'Men', 'Women', 'Kids'];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 32px',
      borderBottom: '1px solid var(--surface-divider)',
      fontFamily: 'var(--font-sans)',
      position: 'sticky',
      top: 0,
      background: '#fff',
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => onNavigate('home'),
    style: {
      fontWeight: 800,
      fontSize: 18,
      letterSpacing: '-0.02em',
      cursor: 'pointer'
    }
  }, "DIVINEXPRESS"), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 28,
      fontSize: 13,
      fontWeight: 600
    }
  }, nav.map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    onClick: () => onNavigate('plp'),
    style: {
      cursor: 'pointer',
      color: page === 'plp' && n === 'Men' ? 'var(--text-primary)' : 'var(--text-primary)'
    }
  }, n)), /*#__PURE__*/React.createElement("span", {
    onClick: () => onNavigate('plp'),
    style: {
      cursor: 'pointer',
      fontWeight: 700,
      color: 'var(--color-red-600)'
    }
  }, "Sale")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      cursor: 'pointer'
    }
  }, "Search"), /*#__PURE__*/React.createElement("span", {
    style: {
      cursor: 'pointer'
    }
  }, "Account"), /*#__PURE__*/React.createElement("span", {
    onClick: () => onNavigate('cart'),
    style: {
      cursor: 'pointer',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, "Bag", cartCount > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--color-black)',
      color: '#fff',
      borderRadius: '50%',
      width: 18,
      height: 18,
      fontSize: 10,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, cartCount))));
}
window.Header = Header;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ecommerce/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ecommerce/Homepage.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const products = [{
  name: 'Air Runner 2',
  category: "Men's Running Shoes",
  price: 150,
  salePrice: 99,
  badge: {
    label: '-34%',
    tone: 'promo'
  }
}, {
  name: 'Court Legacy',
  category: "Women's Shoes",
  price: 89
}, {
  name: 'Flex Trainer',
  category: "Men's Training Shoes",
  price: 120,
  badge: {
    label: 'New',
    tone: 'new'
  }
}, {
  name: 'Sprint Tee',
  category: "Men's Tops",
  price: 45,
  salePrice: 29,
  badge: {
    label: '-35%',
    tone: 'promo'
  }
}];

/** Homepage — two hero directions. `heroVariant="A"` full-bleed statement hero;
 * `"B"` split hero with text panel. Both use the same rails below. */
function Homepage({
  heroVariant = 'A',
  ProductCard,
  Button,
  Badge
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)'
    }
  }, heroVariant === 'A' ? /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      height: 560,
      background: 'var(--color-black)',
      display: 'flex',
      alignItems: 'flex-end',
      color: '#fff',
      padding: 48
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--color-green-500)',
      marginBottom: 12
    }
  }, "Spring Collection \u2014 Up to 40% Off"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 72,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 0.95,
      textTransform: 'uppercase',
      marginBottom: 20
    }
  }, "Run", /*#__PURE__*/React.createElement("br", null), "Further"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    style: {
      background: '#fff',
      color: '#111',
      borderColor: '#fff'
    }
  }, "Shop the Drop"))) : /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      height: 480
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--surface-sunken)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase'
    }
  }, "Campaign image"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: 56
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--color-green-600)',
      marginBottom: 12
    }
  }, "Limited Time"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1,
      marginBottom: 20
    }
  }, "Engineered", /*#__PURE__*/React.createElement("br", null), "for Speed."), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg"
  }, "Shop Now"))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '56px 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 700
    }
  }, "Just Dropped"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "Shop all \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 28
    }
  }, products.map(p => /*#__PURE__*/React.createElement(ProductCard, _extends({
    key: p.name,
    variant: "editorial"
  }, p))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '0 32px 64px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16
    }
  }, ['Men', 'Women', 'Kids'].map(c => /*#__PURE__*/React.createElement("div", {
    key: c,
    style: {
      height: 280,
      background: 'var(--surface-sunken)',
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-end',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700
    }
  }, c)))));
}
window.Homepage = Homepage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ecommerce/Homepage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ecommerce/PDP.jsx
try { (() => {
function PDP({
  Breadcrumb,
  Badge,
  PriceTag,
  Tabs,
  Button
}) {
  const [size, setSize] = React.useState('M');
  const [tab, setTab] = React.useState('Details');
  const sizes = ['S', 'M', 'L', 'XL'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      padding: '32px 32px 64px'
    }
  }, /*#__PURE__*/React.createElement(Breadcrumb, {
    items: ['Home', 'Men', 'Shoes', 'Air Runner 2']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 56,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      aspectRatio: '1/1',
      background: 'var(--surface-sunken)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    }
  }, "Product image ", i + 1))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 420
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "promo"
  }, "-34% Today")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      fontWeight: 800,
      letterSpacing: '-0.01em',
      marginBottom: 6
    }
  }, "Air Runner 2"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-secondary)',
      marginBottom: 16
    }
  }, "Men's Running Shoes"), /*#__PURE__*/React.createElement(PriceTag, {
    price: 150,
    salePrice: 99,
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: 10
    }
  }, "Select Size"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, sizes.map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setSize(s),
    style: {
      width: 52,
      height: 44,
      border: `1.5px solid ${size === s ? 'var(--color-black)' : 'var(--surface-border)'}`,
      background: size === s ? 'var(--color-black)' : '#fff',
      color: size === s ? '#fff' : 'var(--text-primary)',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      borderRadius: 'var(--radius-md)'
    }
  }, s))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--status-low-stock-fg)',
      marginTop: 8,
      fontWeight: 600
    }
  }, "Only 2 left in size M")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    style: {
      flex: 1
    }
  }, "Add to Bag"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg"
  }, "\u2661")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: ['Details', 'Reviews', 'Shipping'],
    active: tab,
    onChange: setTab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 0',
      fontSize: 14,
      color: 'var(--text-secondary)',
      lineHeight: 1.6
    }
  }, tab === 'Details' && 'Engineered mesh upper for breathability, with a responsive foam midsole and rubber outsole for durable traction.', tab === 'Reviews' && '4.6 out of 5 — based on 312 reviews.', tab === 'Shipping' && 'Free standard shipping on orders over €50. Free returns within 30 days.')))));
}
window.PDP = PDP;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ecommerce/PDP.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ecommerce/PLP.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const gridProducts = [{
  name: 'Air Runner 2',
  category: "Men's Shoes",
  price: 150,
  salePrice: 99,
  badge: {
    label: '-34%',
    tone: 'promo'
  }
}, {
  name: 'Flex Trainer',
  category: "Men's Shoes",
  price: 120,
  badge: {
    label: 'New',
    tone: 'new'
  }
}, {
  name: 'Court Legacy',
  category: "Men's Shoes",
  price: 89
}, {
  name: 'Trail Glide',
  category: "Men's Shoes",
  price: 140,
  badge: {
    label: 'Only 2 left',
    tone: 'lowStock'
  }
}, {
  name: 'Studio Slip',
  category: "Men's Shoes",
  price: 75,
  salePrice: 55,
  badge: {
    label: '-27%',
    tone: 'promo'
  }
}, {
  name: 'Pace Racer',
  category: "Men's Shoes",
  price: 160
}];
function PLP({
  ProductCard,
  Breadcrumb,
  Checkbox
}) {
  const [filters, setFilters] = React.useState({
    instock: true,
    sale: false
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      padding: '32px 32px 64px'
    }
  }, /*#__PURE__*/React.createElement(Breadcrumb, {
    items: ['Home', 'Men', 'Shoes']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      margin: '20px 0 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      fontWeight: 800,
      letterSpacing: '-0.01em'
    }
  }, "Men's Shoes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, gridProducts.length, " Results")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 200,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase'
    }
  }, "Filter"), /*#__PURE__*/React.createElement(Checkbox, {
    label: "In stock only",
    checked: filters.instock,
    onChange: v => setFilters(f => ({
      ...f,
      instock: v
    }))
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Sale",
    checked: filters.sale,
    onChange: v => setFilters(f => ({
      ...f,
      sale: v
    }))
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Running",
    checked: false,
    onChange: () => {}
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Training",
    checked: false,
    onChange: () => {}
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '32px 24px'
    }
  }, gridProducts.map(p => /*#__PURE__*/React.createElement(ProductCard, _extends({
    key: p.name,
    variant: "compact"
  }, p))))));
}
window.PLP = PLP;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ecommerce/PLP.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ProductCard = __ds_scope.ProductCard;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.PriceTag = __ds_scope.PriceTag;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Dialog = __ds_scope.Dialog;

})();
