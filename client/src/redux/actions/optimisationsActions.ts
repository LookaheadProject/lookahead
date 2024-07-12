// re-exporting the actions from the slice
import { optimisationsSlice } from '../reducers/optimisationsReducer';
export const { updatePreferences } = optimisationsSlice.actions;