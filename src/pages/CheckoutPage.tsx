import { useEffect, useMemo, useState } from "react";
import { api, type Order, type OrderItemRequest, type SaleConfig } from "../api";
import type { AlertToastState } from "../hooks/useAlertToast";
import { useAddressBook } from "../hooks/useAddressBook";
import { useCart } from "../hooks/useCart";
import { useGuestSession } from "../hooks/useGuestSession";
import { QRCodeSVG } from "qrcode.react";

type CheckoutPageProps = {
	onOrderPlaced: (order: Order) => void;
	onNavigateProfile: () => void;
	onToast: (toast: AlertToastState) => void;
};

const BAKERY_UPI_ID = "8828094471@upi";

export const CheckoutPage = ({ onOrderPlaced, onNavigateProfile, onToast }: CheckoutPageProps) => {
	const { guest, addPlacedOrderId } = useGuestSession();
	const { address } = useAddressBook();
	const { items, subtotal, clearCart } = useCart();
	const [sale, setSale] = useState<SaleConfig | null>(null);
	const [saleDiscount, setSaleDiscount] = useState(0);
	const [saleName, setSaleName] = useState<string | null>(null);
	const [couponCode, setCouponCode] = useState("");
	const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
	const [couponDiscount, setCouponDiscount] = useState(0);
	const [isApplying, setIsApplying] = useState(false);
	const [isPlacing, setIsPlacing] = useState(false);
	const [showProfilePrompt, setShowProfilePrompt] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState<"UPI" | "COD">("UPI");
	const [nameOnOrder, setNameOnOrder] = useState(guest.name);
	const [upiRefId, setUpiRefId] = useState("");
	const [copied, setCopied] = useState(false);
	const couponStorageKey = "bakersfield.cartCoupon";

	const hasCustomItem = items.some((item) => item.itemType === "CUSTOM");
	const itemCount = items.reduce((total, item) => total + item.quantity, 0);

	useEffect(() => {
		const loadSale = async () => {
			try {
				const saleData = await api.getActiveSale();
				setSale(saleData);
			} catch {
				setSale(null);
			}
		};
		loadSale();
	}, []);

	useEffect(() => {
		const raw = localStorage.getItem(couponStorageKey);
		if (!raw) {
			return;
		}
		try {
			const parsed = JSON.parse(raw) as { code?: string };
			if (parsed.code) {
				setCouponCode(parsed.code);
				setAppliedCoupon(parsed.code);
			}
		} catch {
			localStorage.removeItem(couponStorageKey);
		}
	}, []);

	useEffect(() => {
		if (!sale || !sale.active) {
			setSaleDiscount(0);
			setSaleName(null);
			return;
		}
		const discount = sale.type === "PERCENT"
			? Math.max(0, subtotal * (sale.amount / 100))
			: Math.max(0, sale.amount);
		const capped = Math.min(discount, subtotal);
		setSaleDiscount(capped);
		setSaleName(sale.name);
	}, [sale, subtotal]);

	const total = useMemo(() => {
		return Math.max(0, subtotal - saleDiscount - couponDiscount);
	}, [subtotal, saleDiscount, couponDiscount]);
	const roundedTotal = useMemo(() => Math.round(total), [total]);
	const roundingAdjustment = useMemo(() => roundedTotal - total, [roundedTotal, total]);

	const upiUri = useMemo(() => {
		const pn = encodeURIComponent("BakersField");
		return `upi://pay?pa=${BAKERY_UPI_ID}&pn=${pn}&am=${roundedTotal}&cu=INR`;
	}, [roundedTotal]);

	const totalDiscountAmount = saleDiscount + couponDiscount;
	const totalDiscountPercent = subtotal > 0
		? Math.round((totalDiscountAmount / subtotal) * 100)
		: 0;
	const customerFirstName = useMemo(() => {
		const trimmed = guest.name.trim();
		if (!trimmed) {
			return "there";
		}
		return trimmed.split(/\s+/)[0];
	}, [guest.name]);
	const missingDetails = useMemo(() => {
		const missing: string[] = [];
		if (!guest.phone.trim()) {
			missing.push("Phone number");
		}
		if (!address.pinCode.trim()) {
			missing.push("Pin code");
		}
		return missing;
	}, [address.pinCode, guest.phone]);

	useEffect(() => {
		setNameOnOrder((current) => (current ? current : guest.name));
	}, [guest.name]);

	const handleApplyCoupon = async () => {
		const trimmed = couponCode.trim().toUpperCase();
		if (!trimmed) {
			onToast({ type: "error", message: "Enter a coupon code." });
			return;
		}
		if (!guest.phone.trim()) {
			onToast({ type: "error", message: "Please add your phone number first." });
			return;
		}
		setIsApplying(true);
		try {
			const result = await api.validateCoupon({
				code: trimmed,
				subtotalAmountInr: subtotal,
				phoneNumber: guest.phone.trim()
			});
			setCouponDiscount(result.discountAmountInr);
			setAppliedCoupon(result.code);
			if (result.saleDiscountAmountInr != null) {
				setSaleDiscount(result.saleDiscountAmountInr);
			}
			if (result.saleName != null) {
				setSaleName(result.saleName);
			}
			onToast({ type: "success", message: `Coupon ${result.code} applied.` });
		} catch (error) {
			const message = error instanceof Error && error.message
				? error.message
				: "Coupon could not be applied.";
			onToast({ type: "error", message });
			setCouponDiscount(0);
			setAppliedCoupon(null);
		} finally {
			setIsApplying(false);
		}
	};

	const handleClearCoupon = () => {
		setCouponDiscount(0);
		setAppliedCoupon(null);
		setCouponCode("");
		localStorage.removeItem(couponStorageKey);
	};

	useEffect(() => {
		if (!appliedCoupon || !guest.phone.trim()) {
			return;
		}
		const refreshCoupon = async () => {
			try {
				const result = await api.validateCoupon({
					code: appliedCoupon,
					subtotalAmountInr: subtotal,
					phoneNumber: guest.phone.trim()
				});
				setCouponDiscount(result.discountAmountInr);
				if (result.saleDiscountAmountInr != null) {
					setSaleDiscount(result.saleDiscountAmountInr);
				}
				if (result.saleName != null) {
					setSaleName(result.saleName);
				}
			} catch {
				setCouponDiscount(0);
				setAppliedCoupon(null);
			}
		};
		refreshCoupon();
	}, [appliedCoupon, guest.phone, subtotal]);

	const handlePlaceOrder = async () => {
		if (items.length === 0) {
			onToast({ type: "error", message: "Your bag is empty." });
			return;
		}
		if (hasCustomItem) {
			onToast({ type: "error", message: "Custom orders are confirmed via WhatsApp." });
			return;
		}
		if (paymentMethod === "UPI" && !upiRefId.trim()) {
			onToast({ type: "error", message: "Please enter your UPI Transaction ID to verify payment." });
			return;
		}
		if (!guest.phone.trim() || !address.pinCode.trim()) {
			setShowProfilePrompt(true);
			return;
		}
		setIsPlacing(true);
		try {
			const orderItems: OrderItemRequest[] = items
				.filter((item) => item.itemType !== "CUSTOM")
				.map((item) => {
					const itemType: "PRODUCT" | "COMBO" =
						item.itemType === "COMBO" ? "COMBO" : "PRODUCT";
					return {
						itemType,
						itemRefId: item.itemId,
						itemName: item.name,
						unitPriceInr: item.priceInr,
						quantity: item.quantity
					};
				});
			const result = await api.placeOrder({
				customerName: nameOnOrder.trim() || guest.name || "Guest",
				phoneNumber: guest.phone,
				pinCode: address.pinCode,
				addressLabel: address.label,
				addressLine1: address.line1,
				addressLine2: address.line2,
				addressCity: address.city,
				addressState: address.state,
				totalAmountInr: roundedTotal,
				subtotalAmountInr: subtotal,
				couponCode: appliedCoupon ?? undefined,
				itemCount,
				paymentMethod: paymentMethod,
				paymentProvider: paymentMethod,
				paymentReference: paymentMethod === "UPI" ? (upiRefId.trim() || undefined) : undefined,
				paymentStatus: "PENDING",
				placedAt: new Date().toISOString(),
				items: orderItems
			});
			addPlacedOrderId(String(result.id));
			clearCart();
			onToast({ type: "success", message: "Order placed successfully." });
			onOrderPlaced(result);
		} catch (error) {
			const message = error instanceof Error && error.message
				? error.message
				: "Order could not be placed.";
			onToast({ type: "error", message });
		} finally {
			setIsPlacing(false);
		}
	};

	return (
		<section className="page checkout-page">
			<div className="checkout-hero">
				<p className="eyebrow">Final step</p>
				<h2>Ready to place your order, {customerFirstName}?</h2>
				<p className="muted">
					{itemCount} item{itemCount === 1 ? "" : "s"} in review for <strong>₹{roundedTotal}</strong>. No hidden charges, just clear totals.
				</p>
				<div className="checkout-hero__chips" aria-label="Checkout trust points">
					<span>Secure UPI</span>
					<span>Verified payment</span>
					<span>Transparent billing</span>
				</div>
			</div>

			<section className="profile-card">
				<div className="profile-card__header">
					<h3>Coupon</h3>
					<p className="muted">Apply savings before you pay.</p>
				</div>
				<div className="checkout-coupon">
					<div className="field-row">
						<input
							value={couponCode}
							onChange={(event) => setCouponCode(event.target.value)}
							placeholder="Enter code"
						/>
						{appliedCoupon ? (
							<button className="ghost" onClick={handleClearCoupon} type="button">
								Clear
							</button>
						) : (
							<button
								className="primary"
								onClick={handleApplyCoupon}
								type="button"
								disabled={isApplying}
							>
								{isApplying ? "Applying..." : "Apply"}
							</button>
						)}
					</div>
					{appliedCoupon ? (
						<div className="checkout-coupon__applied">
							<span className="checkout-coupon__badge">Applied</span>
							<span className="checkout-coupon__code">{appliedCoupon}</span>
						</div>
					) : null}
				</div>
			</section>

			<section className="profile-card">
				<div className="profile-card__header">
					<h3>Final Cart Items</h3>
					<p className="muted">Please review every line item before placing your order.</p>
				</div>
				<div className="checkout-items">
					{items.length === 0 ? (
						<p className="muted">Your bag is empty.</p>
					) : (
						items.map((item) => (
							<div key={`${item.itemType}-${item.itemId}`} className="checkout-item-row">
								<div className="checkout-item-row__left">
									<strong className="checkout-item-row__name">{item.name}</strong>
									<p className="muted">{item.quantity} x ₹{item.priceInr}</p>
								</div>
								<strong className="checkout-item-row__total">₹{item.priceInr * item.quantity}</strong>
							</div>
						))
					)}
				</div>
			</section>

			<div className="summary-card">
				<div>
					<span>Subtotal</span>
					<strong>₹{subtotal}</strong>
				</div>
				{totalDiscountAmount > 0 ? (
					<div className="summary-line--discount">
						<span>
							Total Discount
							<span className="summary-percent">{totalDiscountPercent}%</span>
						</span>
						<strong>-₹{totalDiscountAmount}</strong>
					</div>
				) : null}
				{saleDiscount > 0 ? (
					<div className="summary-line--discount summary-line--sub">
						<span>{saleName ? `Sale (${saleName})` : "Sale"}</span>
						<strong>-₹{saleDiscount}</strong>
					</div>
				) : null}
				{couponDiscount > 0 ? (
					<div className="summary-line--discount summary-line--sub">
						<span>
							Coupon{appliedCoupon ? ` (${appliedCoupon})` : ""}
						</span>
						<strong>-₹{couponDiscount}</strong>
					</div>
				) : null}
				{Math.abs(roundingAdjustment) >= 0.01 ? (
					<div className="summary-line--sub">
						<span>Rounded Off</span>
						<strong>{roundingAdjustment >= 0 ? "+" : "-"}₹{Math.abs(roundingAdjustment).toFixed(2)}</strong>
					</div>
				) : null}
				<div>
					<span>Total</span>
					<strong>₹{roundedTotal}</strong>
				</div>
			</div>

			<section className="profile-card">
				<div className="profile-card__header">
					<h3>Payment Method</h3>
				</div>
				<label className="checkout-name-field">
					<strong>Name on order (optional)</strong>
					<input
						value={nameOnOrder}
						onChange={(event) => setNameOnOrder(event.target.value)}
						placeholder="Type a name for this order"
					/>
				</label>
				<div className="payment-method-switch" role="tablist" aria-label="Payment method">
					<button
						className={`payment-method-switch__button ${paymentMethod === "UPI" ? "is-active" : ""}`}
						onClick={() => setPaymentMethod("UPI")}
						type="button"
						role="tab"
						aria-selected={paymentMethod === "UPI"}
					>
						Pay via UPI
					</button>
					<button
						className={`payment-method-switch__button ${paymentMethod === "COD" ? "is-active" : ""}`}
						onClick={() => setPaymentMethod("COD")}
						type="button"
						role="tab"
						aria-selected={paymentMethod === "COD"}
					>
						Cash on Delivery
					</button>
				</div>

				{paymentMethod === "UPI" ? (
					<div className="upi-payment-card">
						<p className="muted payment-note">Scan to pay exactly <strong>₹{roundedTotal}</strong> or tap on mobile to open UPI app.</p>
						<div className="upi-qr-block">
							<QRCodeSVG value={upiUri} size={200} />
							<a href={upiUri} className="primary upi-pay-link">
								Pay using UPI App
							</a>
						</div>
						<div className="upi-id-box">
							<div className="upi-id-box__id">
								<span className="upi-id-box__label">UPI ID</span>
								<span className="upi-id-box__value"><strong>{BAKERY_UPI_ID}</strong></span>
							</div>
							<button
								type="button"
								className={`upi-copy-btn ${copied ? "is-copied" : ""}`}
								onClick={() => {
									navigator.clipboard.writeText(BAKERY_UPI_ID);
									setCopied(true);
									setTimeout(() => setCopied(false), 2000);
									onToast({ type: "success", message: "UPI ID copied!" });
								}}
							>
								{copied ? "Copied ✓" : "Copy"}
							</button>
						</div>
						<div className="upi-steps">
							<p><strong>1. Tap the button or scan the QR Code</strong></p>
							<p><strong>2. Complete the payment on your phone</strong></p>
							<p><strong>3. Enter the 12-digit UTR/Reference ID below and click Place Order</strong></p>
							<p><strong>4. (Optional) WhatsApp your screenshot to +91 8828094471 for faster verification!</strong></p>
						</div>
						<label className="upi-ref-label">
							<strong>UPI Transaction / Reference ID</strong>
							<input
								value={upiRefId}
								onChange={(e) => setUpiRefId(e.target.value)}
								placeholder="e.g. 408123456789"
							/>
						</label>
					</div>
				) : (
					<p className="muted cod-note">You will pay <strong>₹{roundedTotal}</strong> with cash when your freshly baked order arrives.</p>
				)}
			</section>

			<button
				className="primary primary--wide"
				type="button"
				onClick={handlePlaceOrder}
				disabled={isPlacing}
			>
				{isPlacing ? "Placing..." : "Place Order"}
			</button>
			{!guest.phone.trim() || !address.pinCode.trim() ? (
				<button
					className="checkout-missing-note"
					type="button"
					onClick={onNavigateProfile}
				>
					Click here to fill your details.
				</button>
			) : null}

			{showProfilePrompt ? (
				<div className="modal">
					<div
						className="modal__backdrop"
						onClick={() => setShowProfilePrompt(false)}
					/>
					<div className="modal__content" role="dialog" aria-modal="true">
						<div className="modal__header">
							<div>
								<p className="eyebrow">Almost there</p>
								<h3>Complete your details</h3>
							</div>
							<button
								className="modal__close"
								onClick={() => setShowProfilePrompt(false)}
								type="button"
							>
								Close
							</button>
						</div>
						<p className="muted">
							Please fill your guest details and address to place the order.
						</p>
						{missingDetails.length > 0 ? (
							<div className="modal-missing">
								<p>Missing details</p>
								<ul>
									{missingDetails.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							</div>
						) : null}
						<div className="admin-actions">
							<button
								className="ghost"
								onClick={() => setShowProfilePrompt(false)}
								type="button"
							>
								Cancel
							</button>
							<button
								className="primary"
								onClick={() => {
									setShowProfilePrompt(false);
									onNavigateProfile();
								}}
								type="button"
							>
								Fill it now
							</button>
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
};
