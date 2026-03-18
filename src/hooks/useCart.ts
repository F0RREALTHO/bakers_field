import { useCallback, useEffect, useMemo, useState } from "react";
import type { Combo, Product } from "../api";

export type CartItemType = "PRODUCT" | "COMBO" | "CUSTOM";

export type CartItem = {
	itemId: number;
	itemType: CartItemType;
	name: string;
	priceInr: number;
	quantity: number;
	details?: string;
	imageUrl?: string;
};

type CustomOrderItem = {
	id: number;
	name: string;
	priceInr: number;
	details?: string;
	imageUrl?: string;
};

const STORAGE_KEY = "bakersfield.cart";

const readCart = (): CartItem[] => {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) {
		return [];
	}
	try {
		const parsed = JSON.parse(raw) as CartItem[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

let currentCart = readCart();
const listeners = new Set<(items: CartItem[]) => void>();

const publish = (next: CartItem[]) => {
	currentCart = next;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	listeners.forEach((listener) => listener(next));
};

export const useCart = () => {
	const [items, setItems] = useState<CartItem[]>(currentCart);

	useEffect(() => {
		const listener = (next: CartItem[]) => {
			setItems(next);
		};
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}, []);

	const persist = useCallback((next: CartItem[]) => {
		publish(next);
	}, []);

	const addItem = useCallback(
		(item: Omit<CartItem, "quantity">, quantity: number) => {
			if (quantity <= 0) {
				return;
			}
			const index = items.findIndex(
				(existing) => existing.itemId === item.itemId && existing.itemType === item.itemType
			);
			if (index >= 0) {
				const updated = items.map((existing, idx) =>
					idx === index
						? { ...existing, quantity: existing.quantity + quantity }
						: existing
				);
				persist(updated);
				return;
			}
			persist([...items, { ...item, quantity }]);
		},
		[items, persist]
	);

	const addProduct = useCallback(
		(product: Product, quantity: number) => {
			addItem(
				{
					itemId: product.id,
					itemType: "PRODUCT",
					name: product.name,
					priceInr: product.priceInr,
					details: product.description,
					imageUrl: product.imageUrl
				},
				quantity
			);
		},
		[addItem]
	);

	const addCombo = useCallback(
		(combo: Combo, quantity: number) => {
			addItem(
				{
					itemId: combo.id,
					itemType: "COMBO",
					name: combo.name,
					priceInr: combo.priceInr,
					details: combo.description,
					imageUrl: combo.imageUrl
				},
				quantity
			);
		},
		[addItem]
	);

	const addCustomOrder = useCallback(
		(custom: CustomOrderItem) => {
			addItem(
				{
					itemId: custom.id,
					itemType: "CUSTOM",
					name: custom.name,
					priceInr: custom.priceInr,
					details: custom.details,
					imageUrl: custom.imageUrl
				},
				1
			);
		},
		[addItem]
	);

	const updateQuantity = useCallback(
		(itemId: number, itemType: CartItemType, quantity: number) => {
			if (quantity <= 0) {
				persist(items.filter((item) => !(item.itemId === itemId && item.itemType === itemType)));
				return;
			}
			persist(
				items.map((item) =>
					item.itemId === itemId && item.itemType === itemType
						? { ...item, quantity }
						: item
				)
			);
		},
		[items, persist]
	);

	const removeItem = useCallback(
		(itemId: number, itemType: CartItemType) => {
			persist(items.filter((item) => !(item.itemId === itemId && item.itemType === itemType)));
		},
		[items, persist]
	);

	const clearCart = useCallback(() => {
		persist([]);
	}, [persist]);

	const subtotal = useMemo(() => {
		return items.reduce((total, item) => total + item.priceInr * item.quantity, 0);
	}, [items]);

	return {
		items,
		subtotal,
		addProduct,
		addCombo,
		addCustomOrder,
		updateQuantity,
		removeItem,
		clearCart
	};
};
