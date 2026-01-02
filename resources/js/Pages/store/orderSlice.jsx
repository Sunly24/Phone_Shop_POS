import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    addItem(state, action) {
      const product = action.payload;
      const existingItem = state.items.find(i => i.product_id === product.product_id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...product, quantity: 1 });
      }
    },
    decreaseItem(state, action) {
      const productId = action.payload;
      const item = state.items.find(i => i.product_id === productId);
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          state.items = state.items.filter(i => i.product_id !== productId);
        }
      }
    },
    removeItem(state, action) {
      const productId = action.payload;
      state.items = state.items.filter(i => i.product_id !== productId);
    },
    clearOrder(state) {
      state.items = [];
    },
  },
});

export const { addItem, decreaseItem, clearOrder, removeItem } = orderSlice.actions;
export default orderSlice.reducer;