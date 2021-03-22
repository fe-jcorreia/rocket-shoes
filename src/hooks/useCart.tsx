import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  // const [stock, setStock] = useState<Stock[]>({} as Stock[])

  // useEffect(() => {
  //   async function loadStock() {
  //     api.get("stock").then((response) => setStock(response.data));
  //   }

  //   loadStock();
  // }, []);

  const addProduct = async (productId: number) => {
    try {
      const productInCart = cart.find((product) => product.id === productId);
      const productInStock = (await api.get(`stock/${productId}`)).data;
      if (!productInStock.amount) {
        throw toast.error("Quantidade solicitada fora de estoque");
      }

      if (!productInCart) {
        const productInApi = (await api.get(`products/${productId}`)).data;
        setCart([...cart, { ...productInApi, amount: 1 }]);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
      } else {
        updateProductAmount({
          productId: productId,
          amount: productInCart.amount + 1,
        });
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((product) => product.id !== productId);
      setCart(newCart);
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const productInStock = (await api.get(`stock/${productId}`)).data;
      if (productInStock.amount) {
        const newCart = cart.map((product) =>
          product.id === productId ? { ...product, amount: amount } : product
        );
        setCart(newCart);
      } else {
        throw toast.error("Quantidade solicitada fora de estoque");
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
