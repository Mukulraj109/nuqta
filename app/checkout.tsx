import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  Switch,
  Dimensions,
  Animated,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useCheckout } from '@/hooks/useCheckout';
import { useCartValidation } from '@/hooks/useCartValidation';
import StockWarningBanner from '@/components/cart/StockWarningBanner';
import CartValidation from '@/components/cart/CartValidation';
import CardOffersSection from '@/components/cart/CardOffersSection';
import { showToast } from '@/components/common/ToastManager';
import { showAlert } from '@/components/common/CrossPlatformAlert';
import { useRegion } from '@/contexts/RegionContext';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND } from '@/constants/brand';
import AddressSelectionModal from '@/components/checkout/AddressSelectionModal';
import FulfillmentTypeSelector from '@/components/checkout/FulfillmentTypeSelector';
import PaymentFailureModal from '@/components/checkout/PaymentFailureModal';
import { PROMO_COIN_MAX_USAGE_PERCENTAGE } from '@/config/checkout.config';
import { campaignsApi } from '@/services/campaignsApi';
import apiClient from '@/services/apiClient';
import { TIER_HIERARCHY } from '@/constants/loyalty';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';

const { width } = Dimensions.get('window');

// --- Checkout UI State Reducer ---

type CheckoutUIState = {
  showPromoModal: boolean;
  promoCode: string;
  customCoinAmount: string;
  showRedemptionModal: boolean;
  redemptionCode: string;
  appliedRedemption: { code: string; benefit: number; storeName?: string; dealTitle?: string } | null;
  validatingRedemption: boolean;
  appliedOfferRedemption: { code: string; cashbackPercentage: number; offerTitle?: string; estimatedCashback?: number } | null;
  voucherCodeInput: string;
  showValidationModal: boolean;
  showWarningBanner: boolean;
  coinSectionExpanded: boolean;
  paymentExpanded: boolean;
  showConfirmModal: boolean;
  selectedPaymentMethod: 'cod' | 'wallet' | 'razorpay' | null;
  processingPayment: boolean;
  processingMessage: string;
  showAddressModal: boolean;
  showPlatformFeeInfo: boolean;
  applyingPromo: boolean;
  showPaymentFailureModal: boolean;
  paymentFailedMethod: 'cod' | 'wallet' | 'razorpay' | null;
  paymentErrorMessage: string | null;
};

type CheckoutUIAction =
  | { type: 'SET_FIELD'; field: keyof CheckoutUIState; value: any }
  | { type: 'OPEN_PROMO_MODAL' }
  | { type: 'CLOSE_PROMO_MODAL' }
  | { type: 'APPLY_REDEMPTION'; payload: CheckoutUIState['appliedRedemption'] }
  | { type: 'CLEAR_REDEMPTION' }
  | { type: 'APPLY_OFFER_REDEMPTION'; payload: CheckoutUIState['appliedOfferRedemption'] }
  | { type: 'CLEAR_OFFER_REDEMPTION' }
  | { type: 'START_PAYMENT'; method: CheckoutUIState['selectedPaymentMethod'] }
  | { type: 'RESET_PAYMENT' }
  | { type: 'CONFIRM_ORDER_START'; message: string }
  | { type: 'REDEMPTION_APPLIED_CLOSE'; payload: CheckoutUIState['appliedRedemption'] }
  | { type: 'SHOW_PAYMENT_FAILURE'; method: CheckoutUIState['paymentFailedMethod']; message: string | null }
  | { type: 'CLOSE_PAYMENT_FAILURE' };

const checkoutUIInitialState: CheckoutUIState = {
  showPromoModal: false,
  promoCode: '',
  customCoinAmount: '',
  showRedemptionModal: false,
  redemptionCode: '',
  appliedRedemption: null,
  validatingRedemption: false,
  appliedOfferRedemption: null,
  voucherCodeInput: '',
  showValidationModal: false,
  showWarningBanner: true,
  coinSectionExpanded: false,
  paymentExpanded: false,
  showConfirmModal: false,
  selectedPaymentMethod: null,
  processingPayment: false,
  processingMessage: '',
  showAddressModal: false,
  showPlatformFeeInfo: false,
  applyingPromo: false,
  showPaymentFailureModal: false,
  paymentFailedMethod: null,
  paymentErrorMessage: null,
};

function checkoutUIReducer(state: CheckoutUIState, action: CheckoutUIAction): CheckoutUIState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'OPEN_PROMO_MODAL':
      return { ...state, showPromoModal: true };
    case 'CLOSE_PROMO_MODAL':
      return { ...state, showPromoModal: false, promoCode: '' };
    case 'APPLY_REDEMPTION':
      return { ...state, appliedRedemption: action.payload };
    case 'CLEAR_REDEMPTION':
      return { ...state, appliedRedemption: null };
    case 'APPLY_OFFER_REDEMPTION':
      return { ...state, appliedOfferRedemption: action.payload };
    case 'CLEAR_OFFER_REDEMPTION':
      return { ...state, appliedOfferRedemption: null };
    case 'START_PAYMENT':
      return { ...state, selectedPaymentMethod: action.method, showConfirmModal: true, paymentExpanded: false };
    case 'RESET_PAYMENT':
      return { ...state, processingPayment: false, processingMessage: '' };
    case 'CONFIRM_ORDER_START':
      return { ...state, showConfirmModal: false, processingPayment: true, processingMessage: action.message };
    case 'REDEMPTION_APPLIED_CLOSE':
      return { ...state, appliedRedemption: action.payload, showRedemptionModal: false, redemptionCode: '' };
    case 'SHOW_PAYMENT_FAILURE':
      return { ...state, showPaymentFailureModal: true, paymentFailedMethod: action.method, paymentErrorMessage: action.message, processingPayment: false, processingMessage: '' };
    case 'CLOSE_PAYMENT_FAILURE':
      return { ...state, showPaymentFailureModal: false, paymentFailedMethod: null, paymentErrorMessage: null };
    default:
      return state;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ offerRedemptionCode?: string; orderId?: string }>();
  // Get region-aware currency symbol
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  // Get user's loyalty tier for coupon eligibility
  const { state: authState } = useAuth();
  const userLoyaltyTier = authState.user?.loyaltyTier || null;
  // Destructure checkout hook return values
  const { state, actions, handlers } = useCheckout(params.orderId);
  const [uiState, dispatch] = useReducer(checkoutUIReducer, checkoutUIInitialState);

  // Destructure UI state for convenient access
  const {
    showPromoModal, promoCode, customCoinAmount,
    showRedemptionModal, redemptionCode, appliedRedemption, validatingRedemption,
    appliedOfferRedemption, voucherCodeInput,
    showValidationModal, showWarningBanner, coinSectionExpanded, paymentExpanded,
    showConfirmModal, selectedPaymentMethod, processingPayment, processingMessage,
    showAddressModal, showPlatformFeeInfo, applyingPromo,
    showPaymentFailureModal, paymentFailedMethod, paymentErrorMessage,
  } = uiState;

  // Track whether payment was actively processing to detect failure transitions
  const wasProcessingRef = useRef(false);
  useEffect(() => {
    wasProcessingRef.current = processingPayment;
  }, [processingPayment]);

  // Detect payment failure: state.error appears while (or right after) processing
  useEffect(() => {
    if (
      state.error &&
      wasProcessingRef.current &&
      /payment|fail|declined|rejected|timeout|razorpay|insufficient/i.test(state.error)
    ) {
      wasProcessingRef.current = false; // prevent double-firing
      dispatch({
        type: 'SHOW_PAYMENT_FAILURE',
        method: selectedPaymentMethod,
        message: state.error,
      });
    }
  }, [state.error]);

  // Initialize offer redemption from route params
  useEffect(() => {
    if (params.offerRedemptionCode && !appliedOfferRedemption) {
      // Validate and apply the code
      validateAndApplyOfferRedemption(params.offerRedemptionCode);
    }
  }, [params.offerRedemptionCode]);

  const validateAndApplyOfferRedemption = async (code: string) => {
    // Format validation - ensure code is not empty and has valid format
    const trimmedCode = code?.trim()?.toUpperCase();
    if (!trimmedCode) {
      showToast({
        message: 'Invalid voucher code',
        type: 'error',
        duration: 3000,
      });
      return;
    }

    // Basic format validation (RED-xxx or 6-digit verification code)
    const isValidFormat = /^RED-[A-Z0-9]+$/i.test(trimmedCode) || /^\d{6}$/.test(trimmedCode);
    if (!isValidFormat) {
      showToast({
        message: 'Invalid voucher code format',
        type: 'error',
        duration: 3000,
      });
      return;
    }

    dispatch({ type: 'SET_FIELD', field: 'validatingRedemption', value: true });
    try {
      const response = await apiClient.post<any>('/offers/redemptions/validate', { code: trimmedCode });
      if (response.data?.success && response.data?.data?.valid) {
        const { offer, redemption } = response.data.data;
        const cashbackPercentage = offer?.cashbackPercentage || 0;
        const cartTotal = state.billSummary?.itemTotal || 0;
        const maxDiscount = offer?.restrictions?.maxDiscountAmount;
        const minOrderValue = offer?.restrictions?.minOrderValue || 0;

        // Check minimum order value
        if (minOrderValue > 0 && cartTotal < minOrderValue) {
          showToast({
            message: `Minimum order of ${currencySymbol}${minOrderValue} required for this voucher`,
            type: 'error',
            duration: 4000,
          });
          return;
        }

        let estimatedCashback = Math.round(cartTotal * (cashbackPercentage / 100));
        if (maxDiscount && estimatedCashback > maxDiscount) {
          estimatedCashback = maxDiscount;
        }

        dispatch({ type: 'APPLY_OFFER_REDEMPTION', payload: {
          code: trimmedCode,
          cashbackPercentage,
          offerTitle: offer?.title,
          estimatedCashback,
        }});

        showToast({
          message: `Cashback voucher applied! You'll get ${currencySymbol}${estimatedCashback} cashback`,
          type: 'success',
          duration: 4000,
        });
      } else {
        // Provide specific error messages based on response
        const errorMessage = response.data?.message || 'Invalid voucher code';
        showToast({
          message: errorMessage,
          type: 'error',
          duration: 3000,
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to validate voucher';
      showToast({
        message: errorMessage,
        type: 'error',
        duration: 3000,
      });
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'validatingRedemption', value: false });
    }
  };

  // Check if cart has service items (services require upfront payment, no COD)
  const serviceItems = state.items?.filter((item: any) => item.itemType === 'service') || [];
  const hasServiceItems = serviceItems.length > 0;
  const productItems = state.items?.filter((item: any) => item.itemType !== 'service') || [];

  // UI state is now managed by checkoutUIReducer (see uiState above)

  // Use cart validation hook with real-time validation
  const {
    validationState,
    hasInvalidItems,
    canCheckout,
    invalidItemCount,
    warningCount,
    errorCount,
    validateCart,
    clearValidation,
    removeInvalidItems,
  } = useCartValidation({
    autoValidate: true, // Enable auto-validation on checkout page
    validationInterval: 30000, // Re-validate every 30 seconds
    showToastNotifications: true, // Show toast for stock changes
  });

  // Calculate total wallet balance from coin system
  const totalWalletBalance = state.coinSystem.nuqtaCoin.available + state.coinSystem.promoCoin.available + (state.coinSystem.storePromoCoin?.available || 0);

  // Validate cart on page load
  useEffect(() => {

    validateCart();
  }, []);

  // Show validation modal if critical issues found
  useEffect(() => {
    if (validationState.validationResult && errorCount > 0) {
      dispatch({ type: 'SET_FIELD', field: 'showValidationModal', value: true });
    }
  }, [errorCount, validationState.validationResult]);

  // Add slider thumb styling for web (client-side only)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'slider-thumb-styles';
      
      // Check if styles already exist
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          input[type="range"] {
            cursor: pointer;
            touch-action: none;
            user-select: none;
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%);
            cursor: grab;
            box-shadow: 0 3px 12px rgba(139, 92, 246, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.5);
            transition: all 0.2s ease;
            border: 3px solid rgba(255, 255, 255, 0.95);
            position: relative;
            z-index: 10;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 16px rgba(139, 92, 246, 0.5), 0 0 0 4px rgba(255, 255, 255, 0.6);
            cursor: grab;
          }
          input[type="range"]::-webkit-slider-thumb:active {
            transform: scale(1.05);
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.7);
            cursor: grabbing;
          }
          input[type="range"]::-moz-range-thumb {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%);
            cursor: grab;
            border: 3px solid rgba(255, 255, 255, 0.95);
            box-shadow: 0 3px 12px rgba(139, 92, 246, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.5);
            transition: all 0.2s ease;
            z-index: 10;
          }
          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 16px rgba(139, 92, 246, 0.5), 0 0 0 4px rgba(255, 255, 255, 0.6);
            cursor: grab;
          }
          input[type="range"]::-moz-range-thumb:active {
            transform: scale(1.05);
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.7);
            cursor: grabbing;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const handleContinueToCheckout = useCallback(() => {
    dispatch({ type: 'SET_FIELD', field: 'showValidationModal', value: false });
  }, []);

  const handleRemoveInvalidItems = useCallback(async () => {
    await removeInvalidItems();
    dispatch({ type: 'SET_FIELD', field: 'showValidationModal', value: false });
  }, [removeInvalidItems]);

  const handleRefreshValidation = async () => {

    await validateCart();
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      showAlert('Error', 'Please enter a promo code', undefined, 'error');
      return;
    }

    const previousPromo = state.appliedPromoCode;
    const codeToApply = promoCode.trim().toUpperCase();

    dispatch({ type: 'SET_FIELD', field: 'applyingPromo', value: true });

    try {
      const result = await handlers.handlePromoCodeApply(codeToApply);

      dispatch({ type: 'CLOSE_PROMO_MODAL' });

      if (result.success) {
        const message = previousPromo
          ? `${previousPromo.code} replaced with ${codeToApply}!`
          : result.message;
        showToast({
          message: message,
          type: 'success',
          duration: 3000,
        });
      } else {
        showToast({
          message: result.message,
          type: 'error',
          duration: 4000,
        });
      }
    } catch (error) {
      showToast({
        message: 'Failed to apply promo code',
        type: 'error',
        duration: 4000,
      });
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'applyingPromo', value: false });
    }
  };

  // Redemption code validation handler
  const handleApplyRedemptionCode = async () => {
    if (!redemptionCode.trim()) {
      showAlert('Error', 'Please enter a redemption code', undefined, 'error');
      return;
    }

    dispatch({ type: 'SET_FIELD', field: 'validatingRedemption', value: true });

    try {
      // Validate redemption code with backend
      const response = await apiClient.get<any>(`/campaigns/redemptions/${redemptionCode.trim().toUpperCase()}`);

      if (!response.success || !response.data) {
        showAlert('Invalid Code', 'This redemption code is invalid or has expired.', undefined, 'error');
        return;
      }

      const redemption = response.data;

      // Check if redemption is active
      if (redemption.status === 'used') {
        showAlert('Deal Already Redeemed', 'This deal code has already been used. Each deal can only be redeemed once.', undefined, 'warning');
        return;
      }
      if (redemption.status !== 'active') {
        showAlert('Code Unavailable', `This redemption code is ${redemption.status}. Please check your deals in My Deals section.`, undefined, 'warning');
        return;
      }

      // Check expiry
      if (new Date(redemption.expiresAt) < new Date()) {
        showAlert('Code Expired', 'This redemption code has expired.', undefined, 'error');
        return;
      }

      // Check if the deal is for this store
      const deal = redemption.dealSnapshot;
      const cartStoreId = state.store?.id || state.store?._id;
      const dealStoreId = deal?.storeId;

      // If deal has a specific store, validate it matches the current cart's store
      if (dealStoreId && cartStoreId && dealStoreId !== cartStoreId) {
        showAlert(
          'Wrong Store',
          `This deal code is for "${deal?.store || 'another store'}". You can only use it when ordering from that store.`,
          [
            { text: 'OK', style: 'default' },
            { text: 'View My Deals', onPress: () => router.push('/my-deals' as any) }
          ],
          'warning'
        );
        return;
      }

      // Check minimum order value
      const cartSubtotal = state.billSummary?.itemTotal || 0;
      if (redemption.campaignSnapshot?.minOrderValue && cartSubtotal < redemption.campaignSnapshot.minOrderValue) {
        showAlert(
          'Minimum Order Required',
          `This deal requires a minimum order of ${currencySymbol}${redemption.campaignSnapshot.minOrderValue}.`,
          undefined,
          'warning'
        );
        return;
      }

      // Calculate benefit
      let benefit = 0;
      // deal is already defined above for store validation
      if (deal?.cashback) {
        const match = deal.cashback.match(/(\d+)/);
        if (match) {
          const value = parseInt(match[1]);
          benefit = deal.cashback.includes('%')
            ? Math.round(cartSubtotal * (value / 100))
            : value;
        }
      } else if (deal?.discount) {
        const match = deal.discount.match(/(\d+)/);
        if (match) {
          const value = parseInt(match[1]);
          benefit = deal.discount.includes('%')
            ? Math.round(cartSubtotal * (value / 100))
            : value;
        }
      }

      // Apply max benefit cap
      if (redemption.campaignSnapshot?.maxBenefit && benefit > redemption.campaignSnapshot.maxBenefit) {
        benefit = redemption.campaignSnapshot.maxBenefit;
      }

      dispatch({ type: 'REDEMPTION_APPLIED_CLOSE', payload: {
        code: redemptionCode.trim().toUpperCase(),
        benefit,
        storeName: deal?.store,
        dealTitle: redemption.campaignSnapshot?.title,
      }});

      showToast({
        message: `Deal applied! You save ${currencySymbol}${benefit}`,
        type: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to validate redemption code', undefined, 'error');
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'validatingRedemption', value: false });
    }
  };

  const handleRemoveRedemption = () => {
    dispatch({ type: 'CLEAR_REDEMPTION' });
    showToast({
      message: 'Deal removed',
      type: 'info',
      duration: 2000,
    });
  };

  // Payment confirmation handlers
  const handlePaymentSelect = (method: 'cod' | 'wallet' | 'razorpay') => {
    // Validate address first
    if (!state.selectedAddress) {
      showAlert(
        'Address Required',
        'Please select a delivery address before proceeding with your order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Select Address', onPress: () => dispatch({ type: 'SET_FIELD', field: 'showAddressModal', value: true }) }
        ],
        'warning'
      );
      return;
    }

    // Validate minimum order value
    const minimumOrder = state.store?.minimumOrder || 0;
    const itemTotal = state.billSummary?.itemTotal || 0;
    if (minimumOrder > 0 && itemTotal < minimumOrder) {
      showAlert(
        'Minimum Order Required',
        `This store requires a minimum order of ${currencySymbol}${minimumOrder}. Your current order is ${currencySymbol}${itemTotal}. Please add more items to proceed.`,
        undefined,
        'warning'
      );
      return;
    }

    // Validate before showing modal
    if (method === 'cod' && hasServiceItems) {
      showAlert('COD Not Available', 'Cash on Delivery is not available for service bookings.', undefined, 'error');
      return;
    }
    if (method === 'wallet' && totalWalletBalance < (state.billSummary?.totalPayable || 0)) {
      showAlert('Insufficient Balance', `Your wallet balance (${totalWalletBalance} RC) is less than the order total.`, undefined, 'error');
      return;
    }

    dispatch({ type: 'START_PAYMENT', method });
  };

  const handleConfirmOrder = async () => {
    if (!selectedPaymentMethod) {
      return;
    }

    // Set processing message based on payment method
    const messages: Record<string, string> = {
      cod: 'Placing your order...',
      wallet: 'Deducting from wallet...',
      razorpay: 'Redirecting to payment...',
    };
    dispatch({ type: 'CONFIRM_ORDER_START', message: messages[selectedPaymentMethod] || 'Processing...' });

    try {
      switch (selectedPaymentMethod) {
        case 'cod':
          await handlers.handleCODPayment({
            rezCoins: state.coinSystem.nuqtaCoin.used || 0,
            promoCoins: state.coinSystem.promoCoin.used || 0,
            storePromoCoins: state.coinSystem.storePromoCoin.used || 0,
            redemptionCode: appliedRedemption?.code,
            offerRedemptionCode: appliedOfferRedemption?.code,
          });
          break;
        case 'wallet':
          await handlers.handleWalletPayment({
            rezCoins: state.coinSystem.nuqtaCoin.used || 0,
            promoCoins: state.coinSystem.promoCoin.used || 0,
            storePromoCoins: state.coinSystem.storePromoCoin.used || 0,
            redemptionCode: appliedRedemption?.code,
            offerRedemptionCode: appliedOfferRedemption?.code,
          });
          break;
        case 'razorpay':
          await handlers.handleRazorpayPayment(undefined, {
            rezCoins: state.coinSystem.nuqtaCoin.used || 0,
            promoCoins: state.coinSystem.promoCoin.used || 0,
            storePromoCoins: state.coinSystem.storePromoCoin.used || 0,
            redemptionCode: appliedRedemption?.code,
            offerRedemptionCode: appliedOfferRedemption?.code,
          });
          break;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Payment failed';
      // Show the payment failure recovery modal instead of just a toast
      dispatch({
        type: 'SHOW_PAYMENT_FAILURE',
        method: selectedPaymentMethod,
        message: errorMsg,
      });
    }
  };

  // --- Payment failure recovery handlers ---
  const handlePaymentFailureRetry = useCallback(() => {
    dispatch({ type: 'CLOSE_PAYMENT_FAILURE' });
    // Re-open the confirmation modal with the same method
    if (paymentFailedMethod) {
      dispatch({ type: 'START_PAYMENT', method: paymentFailedMethod });
    }
  }, [paymentFailedMethod]);

  const handlePaymentFailureSwitchMethod = useCallback((method: 'cod' | 'wallet' | 'razorpay') => {
    dispatch({ type: 'CLOSE_PAYMENT_FAILURE' });
    // Select the new method and open confirm modal
    dispatch({ type: 'START_PAYMENT', method });
  }, []);

  const handlePaymentFailureClose = useCallback(() => {
    dispatch({ type: 'CLOSE_PAYMENT_FAILURE' });
  }, []);

  const getPaymentMethodLabel = (method: string | null) => {
    const labels: Record<string, string> = {
      cod: 'Cash on Delivery',
      wallet: `Wallet (${BRAND.COIN_NAME})`,
      razorpay: 'Online Payment',
    };
    return labels[method || ''] || '';
  };

  const handleQuickPromoSelect = async (selectedPromoCode: string) => {
    const previousPromo = state.appliedPromoCode;

    dispatch({ type: 'SET_FIELD', field: 'applyingPromo', value: true });

    try {
      const result = await handlers.handlePromoCodeApply(selectedPromoCode);

      dispatch({ type: 'SET_FIELD', field: 'showPromoModal', value: false });

      if (result.success) {
        const message = previousPromo
          ? `${previousPromo.code} replaced with ${selectedPromoCode}!`
          : result.message;
        showToast({
          message: message,
          type: 'success',
          duration: 3000,
        });
      } else {
        showToast({
          message: result.message,
          type: 'error',
          duration: 4000,
        });
      }
    } catch (error) {
      showToast({
        message: 'Failed to apply promo code',
        type: 'error',
        duration: 4000,
      });
    } finally {
      dispatch({ type: 'SET_FIELD', field: 'applyingPromo', value: false });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ffcd57" />

      {/* Header with Amount Display */}
      <LinearGradient 
        colors={['#ffcd57', '#1a3a52']} 
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => {

              handlers.handleBackNavigation();
            }}
           
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            accessibilityLabel="Go back to cart"
            accessibilityRole="button"
            accessibilityHint="Double tap to return to shopping cart"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          
          <ThemedText style={styles.headerTitle}>Checkout</ThemedText>
          
          <View style={styles.coinsDisplay}>
            <CachedImage
              source={BRAND.COIN_IMAGE}
              style={styles.coinIconSmall}
              contentFit="contain"
            />
            <ThemedText style={styles.coinsText}>{totalWalletBalance}</ThemedText>
          </View>
        </View>
        
        {/* Amount Display */}
        <View style={styles.amountContainer}>
          <ThemedText style={styles.amountText}>{currencySymbol}{Math.max(0, (state.billSummary?.totalPayable || 0) - (appliedRedemption?.benefit || 0)).toFixed(0)}</ThemedText>
          {(state.billSummary?.cashbackEarned || 0) > 0 && (
            <View style={styles.cashbackBadge}>
              <ThemedText style={styles.cashbackText}>
                Earn {currencySymbol}{state.billSummary?.cashbackEarned || 0} cashback
              </ThemedText>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stock Warning Banner */}
        {showWarningBanner && validationState.validationResult && validationState.validationResult.issues.length > 0 && (
          <StockWarningBanner
            issues={validationState.validationResult.issues}
            onDismiss={() => dispatch({ type: 'SET_FIELD', field: 'showWarningBanner', value: false })}
            onViewDetails={() => dispatch({ type: 'SET_FIELD', field: 'showValidationModal', value: true })}
            autoHide={false}
          />
        )}

        {/* Store Confirmation - Show only if store distance is available */}
        {state.store?.distance && (
          <View style={styles.storeConfirmation}>
            <ThemedText style={styles.storeWarning}>
              The selected store is {state.store.distance} away from your delivery address. Please confirm.
            </ThemedText>
          </View>
        )}

        {/* Card Offers Section */}
        {state.billSummary?.totalPayable && state.billSummary.totalPayable > 0 && (
          <CardOffersSection
            storeId={state.store?.id}
            orderValue={state.billSummary.totalPayable}
            compact={true}
            onOfferApplied={(offer) => {
              // Apply card offer to update bill summary
              handlers.applyCardOffer(offer);
            }}
          />
        )}

        {/* Order Items Preview */}
        {productItems.length > 0 && (
          <View style={styles.orderItemsSection}>
            <View style={styles.orderItemsHeader}>
              <ThemedText style={styles.orderItemsTitle}>
                Order Items ({productItems.length})
              </ThemedText>
              <Pressable onPress={() => router.push('/cart')}>
                <ThemedText style={styles.editCartText}>Edit Cart</ThemedText>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.orderItemsScroll}
            >
              {productItems.slice(0, 5).map((item: any, index: number) => (
                <View key={item.id || index} style={styles.orderItemCard}>
                  <View style={styles.orderItemImageContainer}>
                    {item.image ? (
                      <CachedImage
                        source={item.image}
                        style={styles.orderItemImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.orderItemImagePlaceholder}>
                        <Ionicons name="cube-outline" size={24} color="#9CA3AF" />
                      </View>
                    )}
                    <View style={styles.orderItemQtyBadge}>
                      <ThemedText style={styles.orderItemQtyText}>×{item.quantity}</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.orderItemName} numberOfLines={2}>
                    {item.name}
                  </ThemedText>
                  <ThemedText style={styles.orderItemPrice}>
                    {currencySymbol}{(item.price * item.quantity).toLocaleString()}
                  </ThemedText>
                </View>
              ))}
              {productItems.length > 5 && (
                <Pressable
                  style={styles.moreItemsCard}
                  onPress={() => router.push('/cart')}
                >
                  <ThemedText style={styles.moreItemsText}>
                    +{productItems.length - 5} more
                  </ThemedText>
                </Pressable>
              )}
            </ScrollView>
          </View>
        )}

        {/* Fulfillment Type Selector */}
        <FulfillmentTypeSelector
          availableTypes={state.fulfillment.availableTypes}
          selectedType={state.fulfillment.selectedType}
          onSelect={actions.setFulfillmentType}
        />

        {/* Delivery Address Section (shown only for delivery) */}
        {state.fulfillment.selectedType === 'delivery' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Delivery Address</ThemedText>

            {state.selectedAddress ? (
              <Pressable
                style={styles.addressCard}
                onPress={() => dispatch({ type: 'SET_FIELD', field: 'showAddressModal', value: true })}
               
              >
                <View style={styles.addressCardContent}>
                  <View style={styles.addressIconContainer}>
                    <Ionicons name="location" size={24} color="#ffcd57" />
                  </View>
                  <View style={styles.addressDetails}>
                    <ThemedText style={styles.addressName}>
                      {state.selectedAddress.name || state.selectedAddress.type || 'Delivery Address'}
                    </ThemedText>
                    <ThemedText style={styles.addressText} numberOfLines={2}>
                      {state.selectedAddress.addressLine1}
                      {state.selectedAddress.addressLine2 ? `, ${state.selectedAddress.addressLine2}` : ''}
                    </ThemedText>
                    <ThemedText style={styles.addressCityText}>
                      {state.selectedAddress.city}, {state.selectedAddress.state} - {state.selectedAddress.pincode}
                    </ThemedText>
                    {state.selectedAddress.phone && (
                      <ThemedText style={styles.addressPhoneText}>
                        Phone: {state.selectedAddress.phone}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.changeAddressButton}>
                    <ThemedText style={styles.changeAddressText}>Change</ThemedText>
                  </View>
                </View>
              </Pressable>
            ) : (
              <Pressable
                style={styles.addAddressCard}
                onPress={() => dispatch({ type: 'SET_FIELD', field: 'showAddressModal', value: true })}
              >
                <Ionicons name="add-circle-outline" size={24} color="#ffcd57" />
                <ThemedText style={styles.addAddressText}>Add Delivery Address</ThemedText>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            )}

            {!state.selectedAddress && (
              <View style={styles.addressWarning}>
                <Ionicons name="warning" size={16} color="#F59E0B" />
                <ThemedText style={styles.addressWarningText}>
                  Please add a delivery address to proceed with your order
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Pickup Store Info (shown for pickup) */}
        {state.fulfillment.selectedType === 'pickup' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Pickup Location</ThemedText>
            <View style={[styles.addressCard, { borderColor: '#1a3a52', borderWidth: 1.5 }]}>
              <View style={styles.addressCardContent}>
                <View style={[styles.addressIconContainer, { backgroundColor: '#f0f6fa' }]}>
                  <Ionicons name="storefront-outline" size={24} color="#1a3a52" />
                </View>
                <View style={styles.addressDetails}>
                  <ThemedText style={[styles.addressName, { color: '#1a3a52' }]}>{state.store.name}</ThemedText>
                  <ThemedText style={styles.addressText}>Ready in ~{state.fulfillment.availableTypes.find(t => t.type === 'pickup')?.estimatedTime || '15-20 min'}</ThemedText>
                </View>
                <Ionicons name="navigate-outline" size={22} color="#1a3a52" />
              </View>
            </View>
            <TextInput
              style={[styles.specialInstructionsInput, { marginTop: 10 }]}
              placeholder="Pickup instructions (optional)"
              placeholderTextColor="#9CA3AF"
              value={state.fulfillment.pickupInstructions || ''}
              onChangeText={(text) => actions.setFulfillmentDetails({ pickupInstructions: text })}
              maxLength={200}
            />
          </View>
        )}

        {/* Drive-Thru Info (shown for drive_thru) */}
        {state.fulfillment.selectedType === 'drive_thru' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Drive-Thru</ThemedText>
            <View style={[styles.addressCard, { borderColor: '#1a3a52', borderWidth: 1.5 }]}>
              <View style={styles.addressCardContent}>
                <View style={[styles.addressIconContainer, { backgroundColor: '#f0f6fa' }]}>
                  <Ionicons name="car-outline" size={24} color="#1a3a52" />
                </View>
                <View style={styles.addressDetails}>
                  <ThemedText style={[styles.addressName, { color: '#1a3a52' }]}>{state.store.name}</ThemedText>
                  <ThemedText style={styles.addressText}>Est. wait: {state.fulfillment.availableTypes.find(t => t.type === 'drive_thru')?.estimatedTime || '5-10 min'}</ThemedText>
                </View>
                <Ionicons name="navigate-outline" size={22} color="#1a3a52" />
              </View>
            </View>
            <TextInput
              style={[styles.specialInstructionsInput, { marginTop: 10 }]}
              placeholder="Vehicle description (color, model) - optional"
              placeholderTextColor="#9CA3AF"
              value={state.fulfillment.vehicleInfo || ''}
              onChangeText={(text) => actions.setFulfillmentDetails({ vehicleInfo: text })}
              maxLength={100}
            />
          </View>
        )}

        {/* Dine-In Info (shown for dine_in) */}
        {state.fulfillment.selectedType === 'dine_in' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Dine-In</ThemedText>
            <View style={[styles.addressCard, { borderColor: '#1a3a52', borderWidth: 1.5 }]}>
              <View style={styles.addressCardContent}>
                <View style={[styles.addressIconContainer, { backgroundColor: '#f0f6fa' }]}>
                  <Ionicons name="restaurant-outline" size={24} color="#1a3a52" />
                </View>
                <View style={styles.addressDetails}>
                  <ThemedText style={[styles.addressName, { color: '#1a3a52' }]}>{state.store.name}</ThemedText>
                  <ThemedText style={styles.addressText}>Order from your table</ThemedText>
                </View>
              </View>
            </View>
            <TextInput
              style={[styles.specialInstructionsInput, { marginTop: 10 }]}
              placeholder="Table number *"
              placeholderTextColor="#9CA3AF"
              value={state.fulfillment.tableNumber || ''}
              onChangeText={(text) => actions.setFulfillmentDetails({ tableNumber: text })}
              maxLength={20}
            />
          </View>
        )}

        {/* Apply Promocode Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Apply Promocode</ThemedText>
          
          {state.appliedPromoCode ? (
            <View style={styles.appliedPromoCard}>
              <View style={styles.appliedPromoContent}>
                <Ionicons name="pricetag" size={20} color="#22C55E" />
                <View style={styles.appliedPromoText}>
                  <ThemedText style={styles.appliedPromoTitle}>
                    {state.appliedPromoCode.code} Applied
                  </ThemedText>
                  <ThemedText style={styles.appliedPromoSubtitle}>
                    You saved {currencySymbol}{(state.billSummary?.promoDiscount || 0).toFixed(0)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.appliedPromoActions}>
                <Pressable
                  onPress={() => dispatch({ type: 'OPEN_PROMO_MODAL' })}
                  style={styles.changePromoButton}
                >
                  <ThemedText style={styles.changePromoText}>Change</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const removedCode = state.appliedPromoCode?.code;
                    handlers.removePromoCode?.();
                    setTimeout(() => {
                      showToast({ message: `${removedCode} promo code removed`, type: 'info', duration: 2000 });
                    }, 100);
                  }}
                  style={styles.removePromoButton}
                >
                  <Ionicons name="close" size={20} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.promoCodeCard}
              onPress={() => dispatch({ type: 'OPEN_PROMO_MODAL' })}
             
              accessibilityLabel={`Apply coupon. ${state.availablePromoCodes.length > 0 ? `${state.availablePromoCodes.length} coupons available` : 'Browse available coupons'}`}
              accessibilityRole="button"
              accessibilityHint="Double tap to view and apply discount coupons"
            >
              <View style={styles.promoCodeContent}>
                <View>
                  <ThemedText style={styles.promoCodeTitle}>Apply Coupon</ThemedText>
                  <ThemedText style={styles.promoCodeSubtitle}>
                    {state.availablePromoCodes.length > 0
                      ? `${state.availablePromoCodes.length} coupons available`
                      : 'Browse coupons'
                    }
                  </ThemedText>
                </View>
                <Ionicons name="pricetag" size={20} color="#ffcd57" />
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          )}

          {/* Deal Redemption Code Card */}
          {appliedRedemption ? (
            <View style={[styles.promoCodeCard, { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B' }]}>
              <View style={styles.promoCodeContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: '#F59E0B', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <ThemedText style={{ fontSize: 11, fontWeight: '600', color: '#FFF' }}>{appliedRedemption.code}</ThemedText>
                  </View>
                  <ThemedText style={styles.promoCodeTitle}>{appliedRedemption.dealTitle || 'Deal Applied'}</ThemedText>
                </View>
                <ThemedText style={[styles.promoCodeSubtitle, { color: '#B45309' }]}>
                  You save {currencySymbol}{appliedRedemption.benefit}
                </ThemedText>
              </View>
              <Pressable onPress={handleRemoveRedemption} style={styles.removePromoButton}>
                <Ionicons name="close" size={20} color="#EF4444" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[styles.promoCodeCard, { borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' }]}
              onPress={() => dispatch({ type: 'SET_FIELD', field: 'showRedemptionModal', value: true })}
             
            >
              <View style={styles.promoCodeContent}>
                <View>
                  <ThemedText style={styles.promoCodeTitle}>Have a Deal Code?</ThemedText>
                  <ThemedText style={styles.promoCodeSubtitle}>Redeem your exclusive deal</ThemedText>
                </View>
                <Ionicons name="gift" size={20} color="#F59E0B" />
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          )}

          {/* Cashback Voucher Card (from My Vouchers - RED-xxx format) */}
          {appliedOfferRedemption ? (
            <View style={[styles.promoCodeCard, { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#10B981', marginTop: 8 }]}>
              <View style={styles.promoCodeContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: '#10B981', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <ThemedText style={{ fontSize: 11, fontWeight: '600', color: '#FFF' }}>{appliedOfferRedemption.code}</ThemedText>
                  </View>
                  <ThemedText style={styles.promoCodeTitle}>{appliedOfferRedemption.offerTitle || 'Cashback Voucher'}</ThemedText>
                </View>
                <ThemedText style={[styles.promoCodeSubtitle, { color: '#059669' }]}>
                  {appliedOfferRedemption.cashbackPercentage}% cashback = {currencySymbol}{appliedOfferRedemption.estimatedCashback}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => {
                  dispatch({ type: 'CLEAR_OFFER_REDEMPTION' });
                  showToast({ message: 'Cashback voucher removed', type: 'info', duration: 2000 });
                }}
                style={styles.removePromoButton}
              >
                <Ionicons name="close" size={20} color="#EF4444" />
              </Pressable>
            </View>
          ) : (
            /* Manual Cashback Voucher Code Input */
            <View style={[styles.promoCodeCard, { borderWidth: 1, borderColor: '#10B981', borderStyle: 'dashed', marginTop: 8 }]}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={{
                    fontSize: 14,
                    color: '#111827',
                    paddingVertical: 8,
                    paddingHorizontal: 0,
                  }}
                  placeholder="Enter cashback voucher code (RED-xxx)"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  value={voucherCodeInput}
                  onChangeText={(text) => dispatch({ type: 'SET_FIELD', field: 'voucherCodeInput', value: text })}
                  onSubmitEditing={() => {
                    if (voucherCodeInput.trim()) {
                      validateAndApplyOfferRedemption(voucherCodeInput.trim());
                      dispatch({ type: 'SET_FIELD', field: 'voucherCodeInput', value: '' });
                    }
                  }}
                  returnKeyType="done"
                  editable={!validatingRedemption}
                />
              </View>
              <Pressable
                style={{
                  backgroundColor: validatingRedemption ? '#9CA3AF' : '#10B981',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6,
                  opacity: !voucherCodeInput.trim() ? 0.6 : 1
                }}
                disabled={validatingRedemption || !voucherCodeInput.trim()}
                onPress={() => {
                  if (voucherCodeInput.trim()) {
                    validateAndApplyOfferRedemption(voucherCodeInput.trim());
                    dispatch({ type: 'SET_FIELD', field: 'voucherCodeInput', value: '' });
                  }
                }}
              >
                <ThemedText style={{ color: '#FFF', fontWeight: '600', fontSize: 12 }}>
                  {validatingRedemption ? 'Validating...' : 'Apply'}
                </ThemedText>
              </Pressable>
            </View>
          )}

          {/* Coin Toggles Section - Collapsible */}
          <View style={styles.coinToggles}>
            {/* Collapsible Header */}
            <Pressable
              style={styles.coinSectionHeader}
              onPress={() => dispatch({ type: 'SET_FIELD', field: 'coinSectionExpanded', value: !coinSectionExpanded })}
             
            >
              <View style={styles.coinSectionHeaderLeft}>
                <CachedImage
                  source={BRAND.COIN_IMAGE}
                  style={styles.coinIconMedium}
                  contentFit="contain"
                />
                <View style={styles.coinSectionHeaderText}>
                  <ThemedText style={styles.coinSectionTitle}>Use Your Coins</ThemedText>
                  <ThemedText style={styles.coinSectionSubtitle}>
                    {totalWalletBalance} coins available
                  </ThemedText>
                </View>
              </View>
              <Ionicons
                name={coinSectionExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6B7280"
              />
            </Pressable>

            {/* Coin Options - Only show when expanded */}
            {coinSectionExpanded && (
              <>
            {/* Rez Coin with Slider */}
            <View style={styles.coinSliderCard}>
              <LinearGradient
                colors={['#ffcd57', '#1a3a52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coinSliderGradient}
              >
                <View style={styles.coinSliderHeader}>
                  <View style={styles.coinHeaderLeft}>
                    <View style={styles.coinTitleRow}>
                      <CachedImage
                        source={BRAND.COIN_IMAGE}
                        style={styles.coinIconMedium}
                        contentFit="contain"
                      />
                      <ThemedText style={styles.coinTitleWhite}>{BRAND.COIN_NAME}</ThemedText>
                    </View>
                    <View style={styles.coinAvailableRow}>
                      <ThemedText style={styles.coinAvailableTextWhite}>
                        {state.coinSystem.nuqtaCoin.available} available
                      </ThemedText>
                    </View>
                  </View>
                  {state.coinSystem.nuqtaCoin.used > 0 && (
                    <View style={styles.coinUsedBadgeWhite}>
                      <ThemedText style={styles.coinUsedTextPurple}>
                        {state.coinSystem.nuqtaCoin.used}
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.sliderContainerEnhanced}>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(1, Math.min(
                      state.coinSystem.nuqtaCoin.available,
                      Math.floor(state.billSummary?.totalBeforeCoinDiscount || state.billSummary?.totalPayable || 0)
                    ))}
                    value={state.coinSystem.nuqtaCoin.used}
                    onChange={(e) => {
                      const amount = parseInt(e.target.value);
                      if (amount === 0) {
                        handlers.handleCoinToggle('rez', false);
                      } else {
                        handlers.handleCustomCoinAmount('rez', amount);
                      }
                    }}
                    onInput={(e: any) => {
                      const amount = parseInt(e.target.value);
                      if (amount === 0) {
                        handlers.handleCoinToggle('rez', false);
                      } else {
                        handlers.handleCustomCoinAmount('rez', amount);
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '12px',
                      borderRadius: '6px',
                      outline: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      cursor: 'pointer',
                      touchAction: 'none',
                      pointerEvents: 'auto',
                      background: `linear-gradient(to right, #FFFFFF 0%, #FFFFFF ${(state.coinSystem.nuqtaCoin.used / Math.max(1, Math.min(state.coinSystem.nuqtaCoin.available, Math.floor(state.billSummary?.totalBeforeCoinDiscount || state.billSummary?.totalPayable || 0)))) * 100}%, rgba(255,255,255,0.3) ${(state.coinSystem.nuqtaCoin.used / Math.max(1, Math.min(state.coinSystem.nuqtaCoin.available, Math.floor(state.billSummary?.totalBeforeCoinDiscount || state.billSummary?.totalPayable || 0)))) * 100}%, rgba(255,255,255,0.3) 100%)`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  />
                </View>

                <View style={styles.sliderLabels}>
                  <ThemedText style={styles.sliderLabelTextWhite}>{currencySymbol}0</ThemedText>
                  <ThemedText style={styles.sliderLabelTextWhite}>
                    {currencySymbol}{Math.min(
                      state.coinSystem.nuqtaCoin.available,
                      Math.floor(state.billSummary?.totalBeforeCoinDiscount || state.billSummary?.totalPayable || 0)
                    )}
                  </ThemedText>
                </View>

                {state.coinSystem.nuqtaCoin.used > 0 && (
                  <View style={styles.coinSavingContainerEnhanced}>
                    <View style={styles.savingBadge}>
                      <Ionicons name="gift" size={16} color="#ffcd57" />
                      <ThemedText style={styles.coinSavingTextEnhanced}>
                        You'll save {currencySymbol}{state.coinSystem.nuqtaCoin.used} on this order!
                      </ThemedText>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* Promo Coin */}
            <View style={styles.coinToggleCard}>
              <View style={styles.coinToggleContent}>
                <View>
                  <ThemedText style={styles.coinToggleTitle}>Promo coin</ThemedText>
                  <ThemedText style={styles.coinToggleSubtitle}>
                    Promo coins can be applied for up to {PROMO_COIN_MAX_USAGE_PERCENTAGE}% off
                  </ThemedText>
                </View>
                <View style={styles.coinToggleRight}>
                  <Switch
                    value={state.coinSystem.promoCoin.used > 0}
                    onValueChange={(value) => handlers.handleCoinToggle('promo', value)}
                    trackColor={{ false: '#E5E7EB', true: '#ffcd57' }}
                    thumbColor={'white'}
                    accessibilityLabel="Use promo coins"
                    accessibilityRole="switch"
                    accessibilityHint={`Toggle to ${state.coinSystem.promoCoin.used > 0 ? 'disable' : 'enable'} promo coin discount. ${state.coinSystem.promoCoin.available} coins available`}
                    accessibilityState={{ checked: state.coinSystem.promoCoin.used > 0 }}
                  />
                  <ThemedText style={styles.promoCoinValue}>
                    {state.coinSystem.promoCoin.available}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Store Branded Coins with Slider - Only show if user has coins from this store */}
            {state.coinSystem.storePromoCoin.available > 0 && (
              <View style={styles.coinSliderCard}>
                <LinearGradient
                  colors={['#1a3a52', '#dfebf7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.coinSliderGradient}
                >
                  <View style={styles.coinSliderHeader}>
                    <View style={styles.coinHeaderLeft}>
                      <View style={styles.coinTitleRow}>
                        <Ionicons name="storefront" size={20} color="#ffcd57" />
                        <ThemedText style={styles.coinTitleWhite}>
                          {state.coinSystem.storePromoCoin.storeName
                            ? `${state.coinSystem.storePromoCoin.storeName} Coins`
                            : 'Store Coins'}
                        </ThemedText>
                      </View>
                      <View style={styles.coinAvailableRow}>
                        <ThemedText style={styles.coinAvailableTextWhite}>
                          {state.coinSystem.storePromoCoin.available} available • Up to 30%
                        </ThemedText>
                      </View>
                    </View>
                    {state.coinSystem.storePromoCoin.used > 0 && (
                      <View style={styles.coinUsedBadgeWhite}>
                        <ThemedText style={styles.coinUsedTextGreen}>
                          {state.coinSystem.storePromoCoin.used}
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  <View style={styles.sliderContainerEnhanced}>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(1, Math.min(
                        state.coinSystem.storePromoCoin.available,
                        Math.floor((state.billSummary?.totalPayable || 0) * 0.3) // Max 30% of order
                      ))}
                      value={state.coinSystem.storePromoCoin.used}
                      onChange={(e) => {
                        const amount = parseInt(e.target.value);
                        if (amount === 0) {
                          handlers.handleCoinToggle('storePromo', false);
                        } else {
                          handlers.handleCustomCoinAmount('storePromo', amount);
                        }
                      }}
                      onInput={(e: any) => {
                        const amount = parseInt(e.target.value);
                        if (amount === 0) {
                          handlers.handleCoinToggle('storePromo', false);
                        } else {
                          handlers.handleCustomCoinAmount('storePromo', amount);
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '12px',
                        borderRadius: '6px',
                        outline: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        cursor: 'pointer',
                        touchAction: 'none',
                        pointerEvents: 'auto',
                        background: `linear-gradient(to right, #FFFFFF 0%, #FFFFFF ${(state.coinSystem.storePromoCoin.used / Math.max(1, Math.min(state.coinSystem.storePromoCoin.available, Math.floor((state.billSummary?.totalPayable || 0) * 0.3)))) * 100}%, rgba(255,255,255,0.3) ${(state.coinSystem.storePromoCoin.used / Math.max(1, Math.min(state.coinSystem.storePromoCoin.available, Math.floor((state.billSummary?.totalPayable || 0) * 0.3)))) * 100}%, rgba(255,255,255,0.3) 100%)`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    />
                  </View>

                  <View style={styles.sliderLabels}>
                    <ThemedText style={styles.sliderLabelTextWhite}>{currencySymbol}0</ThemedText>
                    <ThemedText style={styles.sliderLabelTextWhite}>
                      {currencySymbol}{Math.min(
                        state.coinSystem.storePromoCoin.available,
                        Math.floor((state.billSummary?.totalPayable || 0) * 0.3)
                      )}
                    </ThemedText>
                  </View>

                  {state.coinSystem.storePromoCoin.used > 0 && (
                    <View style={styles.coinSavingContainerEnhanced}>
                      <View style={styles.savingBadge}>
                        <Ionicons name="gift" size={16} color="#ffcd57" />
                        <ThemedText style={styles.coinSavingTextEnhanced}>
                          {state.coinSystem.storePromoCoin.storeName || 'Store'} exclusive: You'll save {currencySymbol}{state.coinSystem.storePromoCoin.used}!
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </View>
            )}
              </>
            )}
          </View>
        </View>

        {/* Services Summary - Only show if there are service items */}
        {hasServiceItems && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Services Booked</ThemedText>
            {serviceItems.map((item: any) => {
              const bookingDetails = item.serviceBookingDetails || {};
              const bookingDate = bookingDetails.bookingDate
                ? new Date(bookingDetails.bookingDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                : '';
              const formatTime = (timeStr: string) => {
                if (!timeStr) return '';
                const [hours, minutes] = timeStr.split(':').map(Number);
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHour = hours % 12 || 12;
                return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
              };
              const timeSlot = bookingDetails.timeSlot?.start
                ? `${formatTime(bookingDetails.timeSlot.start)}${bookingDetails.timeSlot.end ? ` - ${formatTime(bookingDetails.timeSlot.end)}` : ''}`
                : '';

              return (
                <View key={item.id || item._id} style={styles.serviceCard}>
                  <View style={styles.serviceCardHeader}>
                    <Ionicons name="cut" size={20} color="#ffcd57" />
                    <ThemedText style={styles.serviceName}>{item.name}</ThemedText>
                  </View>
                  <View style={styles.serviceDetails}>
                    <View style={styles.serviceDetailRow}>
                      <ThemedText style={styles.serviceDetailIcon}>📅</ThemedText>
                      <ThemedText style={styles.serviceDetailText}>{bookingDate}</ThemedText>
                    </View>
                    <View style={styles.serviceDetailRow}>
                      <ThemedText style={styles.serviceDetailIcon}>🕐</ThemedText>
                      <ThemedText style={styles.serviceDetailText}>{timeSlot}</ThemedText>
                    </View>
                    {bookingDetails.duration && (
                      <View style={styles.serviceDetailRow}>
                        <ThemedText style={styles.serviceDetailIcon}>⏱️</ThemedText>
                        <ThemedText style={styles.serviceDetailText}>{bookingDetails.duration} min</ThemedText>
                      </View>
                    )}
                  </View>
                  <View style={styles.servicePrice}>
                    <ThemedText style={styles.servicePriceText}>{currencySymbol}{(item.price || 0).toLocaleString()}</ThemedText>
                  </View>
                </View>
              );
            })}
            {/* Service payment notice */}
            <View style={styles.serviceNotice}>
              <Ionicons name="information-circle" size={16} color="#F59E0B" />
              <ThemedText style={styles.serviceNoticeText}>
                Service bookings require online payment. Cash on Delivery is not available.
              </ThemedText>
            </View>
          </View>
        )}

        {/* Bill Summary */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Bill Summary</ThemedText>
          
          <View style={styles.billSummaryCard}>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Item Total</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {currencySymbol}{(state.billSummary?.itemTotal || 0).toFixed(0)}
              </ThemedText>
            </View>
            
            {(state.billSummary?.getAndItemTotal || 0) > 0 && (
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Get & item Total</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {currencySymbol}{(state.billSummary?.getAndItemTotal || 0).toFixed(0)}
                </ThemedText>
              </View>
            )}

            {(() => {
              const deliveryFee = state.billSummary?.deliveryFee || 0;
              const itemTotal = state.billSummary?.itemTotal || 0;
              const FREE_DELIVERY_THRESHOLD = 500;
              // Count unique stores for calculating what delivery WOULD have been
              const uniqueStores = new Set(state.items.map(item => item.storeId).filter(Boolean));
              const wouldBeDeliveryFee = uniqueStores.size > 0 ? uniqueStores.size * 50 : 50;
              const amountForFreeDelivery = FREE_DELIVERY_THRESHOLD - itemTotal;

              return (
                <>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Delivery Fee</ThemedText>
                    {deliveryFee === 0 && itemTotal >= FREE_DELIVERY_THRESHOLD ? (
                      // Free delivery - show crossed out original price + FREE
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <ThemedText style={[styles.summaryValue, { textDecorationLine: 'line-through', color: '#9CA3AF', fontSize: 12 }]}>
                          {currencySymbol}{wouldBeDeliveryFee}
                        </ThemedText>
                        <ThemedText style={[styles.summaryValue, { color: '#22C55E', fontWeight: '600' }]}>FREE</ThemedText>
                      </View>
                    ) : deliveryFee > 0 ? (
                      // Show regular delivery fee
                      <ThemedText style={styles.summaryValue}>
                        {currencySymbol}{deliveryFee.toFixed(0)}
                      </ThemedText>
                    ) : (
                      // Just show FREE for other cases
                      <ThemedText style={[styles.summaryValue, { color: '#22C55E' }]}>FREE</ThemedText>
                    )}
                  </View>
                  {/* Show hint for free delivery if not yet qualified */}
                  {deliveryFee > 0 && amountForFreeDelivery > 0 && (
                    <View style={{ paddingVertical: 4, paddingHorizontal: 4 }}>
                      <ThemedText style={{ fontSize: 11, color: '#22C55E', fontStyle: 'italic' }}>
                        Add {currencySymbol}{amountForFreeDelivery.toFixed(0)} more for FREE delivery!
                      </ThemedText>
                    </View>
                  )}
                </>
              );
            })()}

            {(state.billSummary?.platformFee || 0) > 0 && (
              <View>
                <View style={styles.summaryRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ThemedText style={styles.summaryLabel}>Platform Fee</ThemedText>
                    <Pressable onPress={() => dispatch({ type: 'SET_FIELD', field: 'showPlatformFeeInfo', value: !showPlatformFeeInfo })}>
                      <Ionicons name="information-circle-outline" size={16} color="#888" />
                    </Pressable>
                  </View>
                  <ThemedText style={styles.summaryValue}>
                    {currencySymbol}{(state.billSummary?.platformFee || 0).toFixed(0)}
                  </ThemedText>
                </View>
                {showPlatformFeeInfo && (
                  <View style={{ backgroundColor: '#f5f5f5', padding: 8, borderRadius: 6, marginTop: 4, marginBottom: 4 }}>
                    <ThemedText style={{ fontSize: 12, color: '#666', lineHeight: 16 }}>
                      Platform fee covers operational costs for order processing, customer support, and maintaining secure payment systems.
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {(state.billSummary?.taxes || 0) > 0 && (
              <View style={styles.summaryRow}>
                <ThemedText style={styles.summaryLabel}>Taxes</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {currencySymbol}{(state.billSummary?.taxes || 0).toFixed(0)}
                </ThemedText>
              </View>
            )}

            {(state.billSummary?.lockFeeDiscount || 0) > 0 && (
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: '#1a3a52' }]}>
                  Lock Fee Already Paid
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: '#1a3a52' }]}>
                  -{currencySymbol}{(state.billSummary?.lockFeeDiscount || 0).toFixed(0)}
                </ThemedText>
              </View>
            )}

            {(state.billSummary?.promoDiscount || 0) > 0 && (
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: '#22C55E' }]}>
                  Promo Discount
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: '#22C55E' }]}>
                  -{currencySymbol}{(state.billSummary?.promoDiscount || 0).toFixed(0)}
                </ThemedText>
              </View>
            )}

            {/* Card Offer Discount - only show if there's an actual discount */}
            {((state.billSummary?.cardOfferDiscount || 0) > 0) && (
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: '#ffcd57' }]}>
                  Card Offer Discount
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: '#ffcd57' }]}>
                  -{currencySymbol}{(state.billSummary?.cardOfferDiscount || 0).toFixed(0)}
                </ThemedText>
              </View>
            )}

            {/* Deal Redemption Benefit */}
            {appliedRedemption && appliedRedemption.benefit > 0 && (
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: '#F59E0B' }]}>
                  Deal Discount ({appliedRedemption.code})
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: '#F59E0B' }]}>
                  -{currencySymbol}{appliedRedemption.benefit.toFixed(0)}
                </ThemedText>
              </View>
            )}

            {/* Cashback Voucher - Shows cashback to be credited after order */}
            {appliedOfferRedemption && appliedOfferRedemption.estimatedCashback && appliedOfferRedemption.estimatedCashback > 0 && (
              <View style={[styles.summaryRow, { backgroundColor: '#ECFDF5', padding: 8, borderRadius: 6, marginVertical: 4 }]}>
                <View>
                  <ThemedText style={[styles.summaryLabel, { color: '#059669', fontWeight: '600' }]}>
                    Cashback ({appliedOfferRedemption.code})
                  </ThemedText>
                  <ThemedText style={{ fontSize: 10, color: '#6B7280' }}>
                    Will be credited to wallet after order
                  </ThemedText>
                </View>
                <ThemedText style={[styles.summaryValue, { color: '#059669', fontWeight: '600' }]}>
                  +{currencySymbol}{appliedOfferRedemption.estimatedCashback}
                </ThemedText>
              </View>
            )}

            {(state.billSummary?.coinDiscount || 0) > 0 && (
              <View style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: '#ffcd57' }]}>
                  {`${BRAND.COIN_SINGLE} Discount`}
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: '#ffcd57' }]}>
                  -{currencySymbol}{(state.billSummary?.coinDiscount || 0).toFixed(0)}
                </ThemedText>
              </View>
            )}
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Round off</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {currencySymbol}{Math.abs(state.billSummary?.roundOff || 0).toFixed(2)}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.totalPayableCard}>
            <ThemedText style={styles.totalPayableLabel}>Total payable</ThemedText>
            <ThemedText style={styles.totalPayableValue}>
              {currencySymbol}{Math.max(0, (state.billSummary?.totalPayable || 0) - (appliedRedemption?.benefit || 0)).toFixed(0)}
            </ThemedText>
          </View>

          {((state.billSummary?.savings || 0) + (appliedRedemption?.benefit || 0)) > 0 && (
            <View style={styles.savingsCard}>
              <ThemedText style={styles.savingsText}>
                🎉 You saved {currencySymbol}{((state.billSummary?.savings || 0) + (appliedRedemption?.benefit || 0)).toFixed(0)} on this order!
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Collapsible Payment Section */}
      <View style={styles.paymentBottomSheet}>
        {/* Main Pay Button - Always Visible */}
        <Pressable
          style={styles.payNowBar}
          onPress={() => dispatch({ type: 'SET_FIELD', field: 'paymentExpanded', value: !paymentExpanded })}
         
        >
          <View style={styles.payNowLeft}>
            <ThemedText style={styles.payNowAmount}>{currencySymbol}{Math.max(0, (state.billSummary?.totalPayable || 0) - (appliedRedemption?.benefit || 0)).toFixed(0)}</ThemedText>
            <ThemedText style={styles.payNowLabel}>Total Amount</ThemedText>
          </View>
          <View style={styles.payNowRight}>
            <LinearGradient
              colors={['#ffcd57', '#E6B84E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payNowButton}
            >
              <ThemedText style={styles.payNowButtonText}>
                {paymentExpanded ? 'Close' : 'Pay Now'}
              </ThemedText>
              <Ionicons
                name={paymentExpanded ? 'chevron-down' : 'chevron-up'}
                size={18}
                color="white"
              />
            </LinearGradient>
          </View>
        </Pressable>

        {/* Expandable Payment Options */}
        {paymentExpanded && (
          <View style={styles.paymentOptionsContainer}>
            <View style={styles.paymentDragIndicator} />

            <ThemedText style={styles.paymentOptionsTitle}>Choose Payment Method</ThemedText>

            {/* Quick Pay Options */}
            <View style={styles.quickPayOptions}>
              {/* Wallet */}
              <Pressable
                style={[
                  styles.quickPayCard,
                  (totalWalletBalance < (state.billSummary?.totalPayable || 0) || !canCheckout) && styles.quickPayDisabled
                ]}
                onPress={() => handlePaymentSelect('wallet')}
                disabled={state.loading || totalWalletBalance < (state.billSummary?.totalPayable || 0) || !canCheckout}
              >
                <View style={[styles.quickPayIcon, { backgroundColor: '#8B5CF6' }]}>
                  <CachedImage
                    source={BRAND.COIN_IMAGE}
                    style={styles.coinIconMedium}
                    contentFit="contain"
                  />
                </View>
                <ThemedText style={styles.quickPayLabel}>Wallet</ThemedText>
                <ThemedText style={styles.quickPayBalance}>{totalWalletBalance} RC</ThemedText>
              </Pressable>

              {/* COD */}
              <Pressable
                style={[
                  styles.quickPayCard,
                  (hasServiceItems || !canCheckout) && styles.quickPayDisabled
                ]}
                onPress={() => handlePaymentSelect('cod')}
                disabled={state.loading || !canCheckout || hasServiceItems}
              >
                <View style={[styles.quickPayIcon, { backgroundColor: hasServiceItems ? '#9CA3AF' : '#F59E0B' }]}>
                  <Ionicons name="cash" size={20} color="white" />
                </View>
                <ThemedText style={styles.quickPayLabel}>COD</ThemedText>
                <ThemedText style={styles.quickPayBalance}>{hasServiceItems ? 'N/A' : 'Pay Later'}</ThemedText>
              </Pressable>
            </View>

            {/* Other Payment Button */}
            <Pressable
              style={styles.otherPaymentOption}
              onPress={() => handlePaymentSelect('razorpay')}
             
            >
              <View style={styles.otherPaymentLeft}>
                <Ionicons name="card-outline" size={22} color="#374151" />
                <View style={styles.otherPaymentText}>
                  <ThemedText style={styles.otherPaymentTitle}>Other Payment Methods</ThemedText>
                  <ThemedText style={styles.otherPaymentSubtitle}>UPI, Credit/Debit Card, Net Banking</ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>

            {/* Security Badge */}
            <View style={styles.securityBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#ffcd57" />
              <ThemedText style={styles.securityText}>100% Secure Payments</ThemedText>
            </View>
          </View>
        )}
      </View>

      {/* Validation Modal */}
      <CartValidation
        visible={showValidationModal}
        validationResult={validationState.validationResult}
        loading={validationState.isValidating}
        onClose={() => dispatch({ type: 'SET_FIELD', field: 'showValidationModal', value: false })}
        onContinueToCheckout={handleContinueToCheckout}
        onRemoveInvalidItems={handleRemoveInvalidItems}
        onRefresh={handleRefreshValidation}
      />

      {/* Promo Code Modal */}
      <Modal
        visible={showPromoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => dispatch({ type: 'CLOSE_PROMO_MODAL' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Apply Promo Code</ThemedText>
              <Pressable onPress={() => dispatch({ type: 'CLOSE_PROMO_MODAL' })}>
                <Ionicons name="close" size={24} color="#374151" />
              </Pressable>
            </View>
            
            <View style={styles.modalBody}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code"
                value={promoCode}
                onChangeText={(text) => dispatch({ type: 'SET_FIELD', field: 'promoCode', value: text })}
                autoCapitalize="characters"
                autoFocus={true}
              />
              
              <View style={styles.availablePromos}>
                <View style={styles.promoHeaderRow}>
                  <ThemedText style={styles.availablePromosTitle}>Available Coupons:</ThemedText>
                  <Pressable onPress={() => {
                    dispatch({ type: 'CLOSE_PROMO_MODAL' });
                    router.push('/account/coupons');
                  }}>
                    <ThemedText style={styles.viewAllLink}>View All →</ThemedText>
                  </Pressable>
                </View>
                {state.availablePromoCodes.length === 0 ? (
                  <View style={styles.noCouponsContainer}>
                    <Ionicons name="pricetag-outline" size={48} color="#999" />
                    <ThemedText style={styles.noCouponsText}>No coupons available</ThemedText>
                    <Pressable
                      style={styles.browseCouponsButton}
                      onPress={() => {
                        dispatch({ type: 'CLOSE_PROMO_MODAL' });
                        router.push('/account/coupons');
                      }}
                    >
                      <ThemedText style={styles.browseCouponsText}>Browse Coupons</ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <ScrollView 
                    style={styles.promoScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {state.availablePromoCodes.map((promo) => {
                    const isCurrentlyApplied = state.appliedPromoCode?.code === promo.code;
                    const itemTotal = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
                    const minOrderEligible = itemTotal >= promo.minOrderValue;

                    // Check tier restrictions - use tierRequirement field if available, otherwise fall back to title check
                    const requiresTier = promo.tierRequirement ||
                                        (promo.title?.toLowerCase().includes('gold') ? 'gold' :
                                         promo.title?.toLowerCase().includes('silver') ? 'silver' :
                                         promo.title?.toLowerCase().includes('platinum') ? 'platinum' : null);
                    const tierName = requiresTier || 'premium';

                    // Check if user's tier meets the requirement
                    const userTierLevel = userLoyaltyTier ? TIER_HIERARCHY[userLoyaltyTier] || 0 : 0;
                    const requiredTierLevel = requiresTier ? TIER_HIERARCHY[requiresTier] || 0 : 0;
                    const meetsTierRequirement = !requiresTier || userTierLevel >= requiredTierLevel;

                    const isEligible = minOrderEligible && meetsTierRequirement;

                    // Calculate discount display
                    const discountDisplay = promo.discountType === 'PERCENTAGE'
                      ? `${promo.discountValue}% OFF`
                      : `${currencySymbol}${promo.discountValue} OFF`;

                    return (
                      <Pressable
                        key={promo.id}
                        style={[
                          styles.promoOption,
                          isCurrentlyApplied && styles.currentPromoOption,
                          !isEligible && styles.ineligiblePromoOption,
                          applyingPromo && styles.promoOptionDisabled
                        ]}
                        onPress={() => {
                          if (applyingPromo) return; // Prevent multiple clicks
                          if (isEligible) {
                            handleQuickPromoSelect(promo.code);
                          } else if (requiresTier && !meetsTierRequirement) {
                            const upgradeMessage = userLoyaltyTier
                              ? `🔒 ${tierName.toUpperCase()} MEMBERS ONLY - Upgrade from ${userLoyaltyTier.toUpperCase()} to ${tierName.toUpperCase()} to unlock this ${promo.discountValue}${promo.discountType === 'PERCENTAGE' ? '%' : currencySymbol} discount!`
                              : `🔒 ${tierName.toUpperCase()} MEMBERS ONLY - Become a member to unlock this ${promo.discountValue}${promo.discountType === 'PERCENTAGE' ? '%' : currencySymbol} discount!`;
                            showToast({
                              message: upgradeMessage,
                              type: 'warning',
                              duration: 4000,
                            });
                          } else {
                            showToast({
                              message: `⚠️ Minimum order value of ${currencySymbol}${promo.minOrderValue} required for this coupon`,
                              type: 'warning',
                              duration: 3000,
                            });
                          }
                        }}
                       
                        disabled={applyingPromo}
                      >
                        <View style={styles.promoOptionContent}>
                          <View style={styles.promoDiscountBadge}>
                            <ThemedText style={styles.promoDiscountText}>{discountDisplay}</ThemedText>
                          </View>
                          <View style={styles.promoOptionText}>
                            <ThemedText style={[
                              styles.promoOptionCode,
                              isCurrentlyApplied && styles.currentPromoCode,
                              !isEligible && styles.ineligibleText
                            ]}>
                              {promo.code}
                            </ThemedText>
                            <ThemedText style={[
                              styles.promoOptionDesc,
                              !isEligible && styles.ineligibleText
                            ]}>
                              {promo.description}
                            </ThemedText>
                            {requiresTier && (
                              <View style={styles.tierBadge}>
                                <Ionicons name="lock-closed" size={10} color="#F59E0B" />
                                <ThemedText style={styles.tierBadgeText}>
                                  {tierName.toUpperCase()} MEMBERS ONLY
                                </ThemedText>
                              </View>
                            )}
                            {promo.minOrderValue > 0 && (
                              <ThemedText style={[styles.minOrderText, minOrderEligible && styles.eligibleMinOrder]}>
                                Min order: {currencySymbol}{promo.minOrderValue}
                              </ThemedText>
                            )}
                          </View>
                          {isCurrentlyApplied && (
                            <View style={styles.appliedBadge}>
                              <Ionicons name="checkmark" size={14} color="white" />
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                  </ScrollView>
                )}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.applyPromoButton, applyingPromo && styles.applyPromoButtonDisabled]}
                onPress={handleApplyPromoCode}
               
                disabled={applyingPromo}
              >
                {applyingPromo ? (
                  <View style={styles.applyPromoLoading}>
                    <ActivityIndicator size="small" color="white" />
                    <ThemedText style={styles.applyPromoText}>Applying...</ThemedText>
                  </View>
                ) : (
                  <ThemedText style={styles.applyPromoText}>Apply Code</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deal Redemption Code Modal */}
      <Modal
        visible={showRedemptionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => dispatch({ type: 'SET_FIELD', field: 'showRedemptionModal', value: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Redeem Deal Code</ThemedText>
              <Pressable onPress={() => dispatch({ type: 'SET_FIELD', field: 'showRedemptionModal', value: false })}>
                <Ionicons name="close" size={24} color="#374151" />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter your deal code (e.g., RZ-XXXXXXXX)"
                value={redemptionCode}
                onChangeText={(text) => dispatch({ type: 'SET_FIELD', field: 'redemptionCode', value: text })}
                autoCapitalize="characters"
                autoFocus={true}
              />

              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="information-circle" size={18} color="#6B7280" />
                  <ThemedText style={{ fontSize: 13, color: '#6B7280', marginLeft: 6 }}>
                    Enter the redemption code you received when you redeemed a deal.
                  </ThemedText>
                </View>
                <ThemedText style={{ fontSize: 12, color: '#9CA3AF' }}>
                  You can find your redeemed deals in the "My Deals" section.
                </ThemedText>
              </View>

              <Pressable
                style={[styles.applyPromoButton, validatingRedemption && styles.applyPromoButtonDisabled, { marginTop: 20 }]}
                onPress={handleApplyRedemptionCode}
               
                disabled={validatingRedemption}
              >
                {validatingRedemption ? (
                  <View style={styles.applyPromoLoading}>
                    <ActivityIndicator size="small" color="white" />
                    <ThemedText style={styles.applyPromoText}>Validating...</ThemedText>
                  </View>
                ) : (
                  <ThemedText style={styles.applyPromoText}>Apply Deal Code</ThemedText>
                )}
              </Pressable>

              <Pressable
                style={{ marginTop: 12, alignItems: 'center' }}
                onPress={() => {
                  dispatch({ type: 'SET_FIELD', field: 'showRedemptionModal', value: false });
                  router.push('/my-deals' as any);
                }}
              >
                <ThemedText style={{ color: '#F59E0B', fontWeight: '500' }}>View My Deals →</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Order Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => dispatch({ type: 'SET_FIELD', field: 'showConfirmModal', value: false })}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            {/* Header */}
            <LinearGradient
              colors={['#ffcd57', '#E6B84E']}
              style={styles.confirmModalHeader}
            >
              <View style={styles.confirmModalHeaderContent}>
                <Ionicons name="checkmark-circle" size={32} color="white" />
                <ThemedText style={styles.confirmModalTitle}>Confirm Order</ThemedText>
              </View>
            </LinearGradient>

            {/* Body */}
            <View style={styles.confirmModalBody}>
              {/* Order Summary */}
              <View style={styles.confirmSummaryCard}>
                <View style={styles.confirmSummaryRow}>
                  <ThemedText style={styles.confirmSummaryLabel}>Items</ThemedText>
                  <ThemedText style={styles.confirmSummaryValue}>
                    {state.items?.length || 0} item{(state.items?.length || 0) !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
                <View style={styles.confirmSummaryRow}>
                  <ThemedText style={styles.confirmSummaryLabel}>Subtotal</ThemedText>
                  <ThemedText style={styles.confirmSummaryValue}>
                    {currencySymbol}{(state.billSummary?.itemTotal || 0).toFixed(0)}
                  </ThemedText>
                </View>
                {(state.billSummary?.lockFeeDiscount || 0) > 0 && (
                  <View style={styles.confirmSummaryRow}>
                    <ThemedText style={[styles.confirmSummaryLabel, { color: '#1a3a52' }]}>
                      Lock Fee Already Paid
                    </ThemedText>
                    <ThemedText style={[styles.confirmSummaryValue, { color: '#1a3a52' }]}>
                      -{currencySymbol}{(state.billSummary?.lockFeeDiscount || 0).toFixed(0)}
                    </ThemedText>
                  </View>
                )}
                {(state.billSummary?.promoDiscount || 0) > 0 && (
                  <View style={styles.confirmSummaryRow}>
                    <ThemedText style={[styles.confirmSummaryLabel, { color: '#22C55E' }]}>
                      Promo Discount
                    </ThemedText>
                    <ThemedText style={[styles.confirmSummaryValue, { color: '#22C55E' }]}>
                      -{currencySymbol}{(state.billSummary?.promoDiscount || 0).toFixed(0)}
                    </ThemedText>
                  </View>
                )}
                {(state.billSummary?.coinDiscount || 0) > 0 && (
                  <View style={styles.confirmSummaryRow}>
                    <ThemedText style={[styles.confirmSummaryLabel, { color: '#ffcd57' }]}>
                      Coin Discount
                    </ThemedText>
                    <ThemedText style={[styles.confirmSummaryValue, { color: '#ffcd57' }]}>
                      -{currencySymbol}{(state.billSummary?.coinDiscount || 0).toFixed(0)}
                    </ThemedText>
                  </View>
                )}
                {appliedRedemption && appliedRedemption.benefit > 0 && (
                  <View style={styles.confirmSummaryRow}>
                    <ThemedText style={[styles.confirmSummaryLabel, { color: '#F59E0B' }]}>
                      Deal Discount ({appliedRedemption.code})
                    </ThemedText>
                    <ThemedText style={[styles.confirmSummaryValue, { color: '#F59E0B' }]}>
                      -{currencySymbol}{appliedRedemption.benefit.toFixed(0)}
                    </ThemedText>
                  </View>
                )}
                <View style={[styles.confirmSummaryRow, styles.confirmTotalRow]}>
                  <ThemedText style={styles.confirmTotalLabel}>Total Amount</ThemedText>
                  <ThemedText style={styles.confirmTotalValue}>
                    {currencySymbol}{((state.billSummary?.totalPayable || 0) - (appliedRedemption?.benefit || 0)).toFixed(0)}
                  </ThemedText>
                </View>
              </View>

              {/* Payment Method */}
              <View style={styles.confirmPaymentMethod}>
                <ThemedText style={styles.confirmPaymentLabel}>Payment Method</ThemedText>
                <View style={styles.confirmPaymentBadge}>
                  {selectedPaymentMethod === 'wallet' ? (
                    <CachedImage
                      source={BRAND.COIN_IMAGE}
                      style={{ width: 18, height: 18 }}
                      contentFit="contain"
                    />
                  ) : (
                    <Ionicons
                      name={selectedPaymentMethod === 'cod' ? 'cash' : 'card'}
                      size={18}
                      color="#ffcd57"
                    />
                  )}
                  <ThemedText style={styles.confirmPaymentValue}>
                    {getPaymentMethodLabel(selectedPaymentMethod)}
                  </ThemedText>
                </View>
              </View>

              {/* Trust Badge */}
              <View style={styles.confirmTrustBadge}>
                <Ionicons name="lock-closed" size={14} color="#6B7280" />
                <ThemedText style={styles.confirmTrustText}>
                  Your payment is secured with 256-bit encryption
                </ThemedText>
              </View>
            </View>

            {/* Footer Buttons */}
            <View style={styles.confirmModalFooter}>
              <Pressable
                style={styles.confirmCancelButton}
                onPress={() => dispatch({ type: 'SET_FIELD', field: 'showConfirmModal', value: false })}
              >
                <ThemedText style={styles.confirmCancelText}>Review Cart</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.confirmPayButton, processingPayment && { opacity: 0.5 }]}
                onPress={handleConfirmOrder}
                disabled={processingPayment}
              >
                <LinearGradient
                  colors={['#ffcd57', '#E6B84E']}
                  style={styles.confirmPayGradient}
                >
                  <ThemedText style={styles.confirmPayText}>
                    Confirm & Pay {currencySymbol}{((state.billSummary?.totalPayable || 0) - (appliedRedemption?.benefit || 0)).toFixed(0)}
                  </ThemedText>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Address Selection Modal */}
      <AddressSelectionModal
        visible={showAddressModal}
        addresses={state.availableAddresses || []}
        selectedAddressId={state.selectedAddress?.id}
        onSelect={(address) => {
          handlers.handleAddressSelect(address);
          dispatch({ type: 'SET_FIELD', field: 'showAddressModal', value: false });
        }}
        onClose={() => dispatch({ type: 'SET_FIELD', field: 'showAddressModal', value: false })}
        onAddNew={() => {
          dispatch({ type: 'SET_FIELD', field: 'showAddressModal', value: false });
          router.push('/account/addresses');
        }}
        loading={state.loading}
      />

      {/* Payment Processing Overlay */}
      {processingPayment && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContent}>
            <View style={styles.processingSpinner}>
              <Ionicons name="sync" size={48} color="#ffcd57" />
            </View>
            <ThemedText style={styles.processingMessage}>{processingMessage}</ThemedText>
            <ThemedText style={styles.processingWarning}>Please don't close the app</ThemedText>
          </View>
        </View>
      )}

      {/* Payment Failure Recovery Modal */}
      <PaymentFailureModal
        visible={showPaymentFailureModal}
        onClose={handlePaymentFailureClose}
        onRetry={handlePaymentFailureRetry}
        onSwitchMethod={handlePaymentFailureSwitchMethod}
        failedMethod={paymentFailedMethod}
        errorMessage={paymentErrorMessage}
      />
    </View>
    </KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  
  // Header Styles
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 28,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
    padding: 0,
    position: 'relative',
    zIndex: 10,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text.inverse,
    flex: 1,
    textAlign: 'center',
    marginLeft: -40,
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  coinsText: {
    color: Colors.text.inverse,
    ...Typography.bodySmall,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  coinIconSmall: {
    width: 16,
    height: 16,
  },
  coinIconMedium: {
    width: 24,
    height: 24,
  },

  // Amount Display
  amountContainer: {
    alignItems: 'center',
  },
  amountText: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.text.inverse,
    marginBottom: 10,
    letterSpacing: -1,
  },
  cashbackBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  cashbackText: {
    color: Colors.text.inverse,
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Content
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Store Confirmation
  storeConfirmation: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  storeWarning: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // Sections
  section: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.base,
  },
  
  // Promo Code Card
  promoCodeCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  promoCodeContent: {
    flex: 1,
  },
  promoCodeTitle: {
    ...Typography.bodyLarge,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  promoCodeSubtitle: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  
  // Coin Toggles
  coinToggles: {
    gap: Spacing.md,
  },
  coinSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  coinSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  coinSectionHeaderText: {
    gap: 2,
  },
  coinSectionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  coinSectionSubtitle: {
    fontSize: 13,
    color: Colors.nileBlue,
    fontWeight: '500',
  },
  coinToggleCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  coinToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coinToggleTitle: {
    ...Typography.bodyLarge,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  customCoinInput: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  coinAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  coinInputLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  changeAmountButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 6,
  },
  changeAmountText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  coinSavingText: {
    ...Typography.bodySmall,
    color: Colors.gold,
    fontWeight: '500',
  },
  coinToggleSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    maxWidth: width * 0.6,
  },
  coinToggleRight: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  coinValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  coinValueText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  promoCoinValue: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.sm,
  },
  // Enhanced Slider Styles
  coinSliderCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.gold,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  coinSliderGradient: {
    padding: 14,
    borderRadius: BorderRadius.md,
  },
  coinSliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  coinHeaderLeft: {
    flex: 1,
  },
  coinTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  coinTitleWhite: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.text.inverse,
    letterSpacing: 0.3,
  },
  coinAvailableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  coinAvailableText: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  coinAvailableTextWhite: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  coinUsedBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  coinUsedText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  coinUsedBadgeWhite: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  coinUsedTextPurple: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.gold,
  },
  coinUsedTextGreen: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.gold,
  },
  sliderContainer: {
    marginBottom: Spacing.sm,
  },
  sliderContainerEnhanced: {
    marginBottom: 10,
    paddingVertical: 6,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sliderLabelText: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  sliderLabelTextWhite: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  coinSavingContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  coinSavingContainerEnhanced: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  savingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  coinSavingTextEnhanced: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '600',
    flex: 1,
  },
  
  // Bill Summary
  billSummaryCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.background.secondary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Total Payable
  totalPayableCard: {
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  totalPayableLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  totalPayableValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.inverse,
  },
  
  // Bottom Buttons
  bottomSpace: {
    height: 220,
  },

  // Collapsible Payment Bottom Sheet
  paymentBottomSheet: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    paddingBottom: 80, // Account for bottom navigation
  },
  payNowBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  payNowLeft: {
    flex: 1,
  },
  payNowAmount: {
    ...Typography.h2,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  payNowLabel: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  payNowRight: {},
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  payNowButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  paymentOptionsContainer: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  paymentDragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
  paymentOptionsTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.base,
  },
  quickPayOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  quickPayCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: 14,
    alignItems: 'center',
    ...Shadows.subtle,
  },
  quickPayDisabled: {
    opacity: 0.5,
  },
  quickPayIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,

    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickPayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  quickPayBalance: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  otherPaymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  otherPaymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  otherPaymentText: {},
  otherPaymentTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  otherPaymentSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  securityText: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },

  disabledButton: {
    opacity: 0.5,
  },

  // Applied Promo Code
  appliedPromoCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  appliedPromoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appliedPromoText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  appliedPromoTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: '#22C55E',
    marginBottom: 2,
  },
  appliedPromoSubtitle: {
    ...Typography.bodySmall,
    color: '#16A34A',
  },
  appliedPromoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  changePromoButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  changePromoText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  removePromoButton: {
    padding: Spacing.xs,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingTop: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.text.primary,
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  promoInput: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  specialInstructionsInput: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    ...Typography.body,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  availablePromos: {
    marginTop: 10,
  },
  promoScrollView: {
    maxHeight: 400,
    marginTop: 12,
  },
  promoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  availablePromosTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  viewAllLink: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.gold,
  },
  noCouponsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCouponsText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    marginTop: Spacing.md,
    marginBottom: Spacing.base,
  },
  browseCouponsButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
  },
  browseCouponsText: {
    color: Colors.text.inverse,
    ...Typography.body,
    fontWeight: '600',
  },
  promoOption: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  currentPromoOption: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
    borderWidth: 2,
  },
  ineligiblePromoOption: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  promoOptionDisabled: {
    opacity: 0.5,
  },
  promoOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  promoDiscountBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  promoDiscountText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  promoOptionText: {
    flex: 1,
  },
  promoOptionCode: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 2,
  },
  currentPromoCode: {
    color: '#22C55E',
  },
  ineligibleText: {
    color: Colors.text.tertiary,
  },
  promoOptionDesc: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
  },
  minOrderText: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '500',
    marginTop: 2,
  },
  eligibleMinOrder: {
    color: '#22C55E',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginTop: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  tierBadgeText: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appliedBadge: {
    backgroundColor: '#22C55E',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  applyPromoButton: {
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  applyPromoButtonDisabled: {
    backgroundColor: '#86EFAC',
  },
  applyPromoLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  applyPromoText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  
  // Savings Card
  savingsCard: {
    backgroundColor: '#FEF3E2',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  savingsText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#D97706',
    textAlign: 'center',
  },

  // Service Card Styles
  serviceCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  serviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  serviceName: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  serviceDetails: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  serviceDetailIcon: {
    ...Typography.body,
    width: 20,
  },
  serviceDetailText: {
    ...Typography.body,
    color: '#374151',
    fontWeight: '500',
  },
  servicePrice: {
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingTop: Spacing.md,
    alignItems: 'flex-end',
  },
  servicePriceText: {
    ...Typography.h4,
    fontWeight: '700',
    color: Colors.gold,
  },
  serviceNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3E2',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  serviceNoticeText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },

  // Disabled states for COD
  disabledText: {
    color: Colors.text.tertiary,
  },
  disabledBadge: {
    backgroundColor: Colors.border.default,
  },
  disabledBadgeText: {
    color: Colors.text.tertiary,
  },

  // Order Items Preview Section
  orderItemsSection: {
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.sm,
  },
  orderItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  orderItemsTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  editCartText: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.gold,
  },
  orderItemsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  orderItemCard: {
    width: 100,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: 10,
    alignItems: 'center',
  },
  orderItemImageContainer: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
  },
  orderItemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItemQtyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.gold,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  orderItemQtyText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  orderItemName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    lineHeight: 14,
  },
  orderItemPrice: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.gold,
  },
  moreItemsCard: {
    width: 80,
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.md,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
  },
  moreItemsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gold,
  },

  // Order Confirmation Modal Styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  confirmModalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  confirmModalHeader: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  confirmModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  confirmModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  confirmModalBody: {
    padding: Spacing.lg,
  },
  confirmSummaryCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  confirmSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  confirmSummaryLabel: {
    ...Typography.body,
    color: Colors.text.tertiary,
  },
  confirmSummaryValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  confirmTotalRow: {
    borderBottomWidth: 0,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 2,
    borderTopColor: Colors.border.default,
  },
  confirmTotalLabel: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  confirmTotalValue: {
    ...Typography.h3,
    fontWeight: '800',
    color: Colors.gold,
  },
  confirmPaymentMethod: {
    marginBottom: Spacing.base,
  },
  confirmPaymentLabel: {
    fontSize: 13,
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  confirmPaymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  confirmPaymentValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gold,
  },
  confirmTrustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  confirmTrustText: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
  },
  confirmModalFooter: {
    flexDirection: 'row',
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  confirmPayButton: {
    flex: 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  confirmPayGradient: {
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  confirmPayText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.text.inverse,
  },

  // Processing Overlay Styles
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  processingContent: {
    alignItems: 'center',
    padding: 32,
  },
  processingSpinner: {
    marginBottom: 24,
  },
  processingMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingWarning: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Address Section Styles
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  addressCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressDetails: {
    flex: 1,
    paddingRight: 8,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 2,
  },
  addressCityText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  addressPhoneText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  changeAddressButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  changeAddressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffcd57',
  },
  addAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    padding: 16,
    gap: 12,
  },
  addAddressText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#ffcd57',
  },
  addressWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  addressWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
});