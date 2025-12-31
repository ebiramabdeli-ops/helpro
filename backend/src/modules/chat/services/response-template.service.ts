import { Injectable } from '@nestjs/common';

/**
 * ResponseTemplateService
 * 
 * Pre-written response templates with variables.
 * NO free text generation - Controlled, safe, multilingual.
 * 
 * Why templates work better than LLM:
 * - No hallucinations
 * - Legal safety (no unpredictable text)
 * - Multilingual control (translate once)
 * - Same UX everywhere
 * - Fast & cheap
 * 
 * Template format:
 * "Hi {name}, I can help you book {service} in {city}."
 */
@Injectable()
export class ResponseTemplateService {
  /**
   * Response templates by intent.
   */
  private readonly TEMPLATES = {
    // Greeting
    greeting: {
      default: "Hi {name}! 👋 How can I help you today?",
      returning: "Welcome back, {name}! What would you like to do?",
    },

    // Booking - Cleaning
    book_cleaning: {
      start: "Great! I can help you book home cleaning. Where should it take place?",
      with_location: "Perfect! Cleaning in {city}. When would you like the service?",
      with_time: "Got it! Cleaning on {date} at {time}. Let me find available helpers...",
    },

    // Booking - Moving
    book_moving: {
      start: "I can help you with moving! Where are you moving from?",
      with_location: "Moving from {fromCity} to {toCity}. How many rooms?",
      with_details: "Perfect! {rooms} rooms on {date}. Let me find strong helpers...",
    },

    // Booking - Recycling
    book_recycling: {
      start: "I can help with recycling pickup! What items do you need to dispose?",
      with_items: "Got it! Disposing {items} in {city}. When is a good time for pickup?",
    },

    // Price questions
    ask_price: {
      cleaning: "Home cleaning starts at €{basePrice}/hour. The exact price depends on size and location. Would you like to book?",
      moving: "Moving help costs €{basePrice}/hour per helper. Need 2-4 helpers depending on furniture. Want a detailed quote?",
      general: "Prices vary by service. Which service are you interested in?\n[Home Cleaning] [Moving Help] [Recycling]",
    },

    // Availability
    ask_availability: {
      yes: "Yes! {service} is available in {city}. Would you like to book today or tomorrow?",
      no: "Sorry, {service} is not yet available in {city}. We're expanding soon! Want me to notify you?",
    },

    // Provider onboarding
    become_provider: {
      start: "Awesome! We're always looking for reliable helpers. Are you interested in:\n[Home Cleaning] [Moving Help] [Both]",
      requirements: "Great! To join as {service} provider, you need:\n✓ Valid ID\n✓ Background check\n{extraRequirements}\nReady to start verification?",
    },

    // Trust & Safety
    trust_safety: {
      general: "Your safety is our priority! All providers are:\n✓ Identity verified\n✓ Background checked\n✓ Rated by customers\n✓ Insured by us",
      specific: "{providerName} is L{verificationLevel} verified with {rating}⭐ rating from {reviewCount} customers.",
    },

    // Complaint
    complaint: {
      acknowledge: "I'm sorry to hear that! Let me help resolve this. What went wrong with your order #{orderId}?",
      escalate: "I understand. I'm escalating this to our support team. They'll contact you within 1 hour. Reference: #{ticketId}",
    },

    // Payment
    payment_issue: {
      not_charged: "Don't worry! You'll only be charged after the job is completed and you confirm it. Your card is safe with us.",
      refund: "I see your order #{orderId} was cancelled. Refund of €{amount} will arrive in 3-5 business days.",
    },

    // Change booking
    change_booking: {
      start: "I can help you change order #{orderId}. What would you like to modify?\n[Date/Time] [Location] [Cancel]",
      confirm: "Updated! Your {service} is now on {newDate} at {newTime}. I've notified {providerName}.",
    },

    // Thanks
    thanks: {
      default: "You're welcome! Need anything else?",
      after_booking: "You're welcome! Your booking is confirmed. See you on {date}! 🎉",
    },

    // Help
    help: {
      default: "I can help you with:\n📅 Book services (cleaning, moving, recycling)\n💰 Check prices & availability\n👤 Become a service provider\n🛡️ Trust & safety info\n💳 Payment questions\n\nWhat interests you?",
    },

    // Unknown intent
    unknown: {
      default: "I'm not sure I understood. Could you clarify? Or choose one:\n[Book Service] [Pricing] [My Bookings] [Help]",
      with_alternatives: "Did you mean:\n{alternatives}",
    },

    // Confirmation messages
    confirm: {
      booking_created: "✅ Booking confirmed!\n\n{service}\n📍 {address}\n📅 {date} at {time}\n💰 €{price}\n\nProvider: {providerName} ({rating}⭐)\n\nYou'll be charged after completion.",
      payment_successful: "✅ Payment received! €{amount} paid securely.",
      order_completed: "✅ Order completed! How was your experience? Please rate {providerName}:",
    },

    // Error messages
    error: {
      generic: "Oops! Something went wrong. Please try again or contact support.",
      no_providers: "Sorry, no available providers in {city} for {date}. Try a different time?",
      verification_required: "To book this service, please verify your identity first. Takes 2 minutes! [Start Verification]",
    },
  };

  /**
   * Generate response from template.
   */
  generate(
    intent: string,
    variant: string,
    variables?: Record<string, any>,
  ): string {
    const template = this.TEMPLATES[intent]?.[variant];

    if (!template) {
      return this.TEMPLATES.unknown.default;
    }

    // Replace variables
    let response = template;
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        response = response.replace(new RegExp(`{${key}}`, 'g'), String(value));
      }
    }

    return response;
  }

  /**
   * Get template with quick reply buttons.
   */
  generateWithButtons(
    intent: string,
    variant: string,
    variables?: Record<string, any>,
    buttons?: Array<{ label: string; action: string; value?: any }>,
  ): {
    text: string;
    buttons?: Array<{ label: string; action: string; value?: any }>;
  } {
    const text = this.generate(intent, variant, variables);

    return {
      text,
      buttons,
    };
  }

  /**
   * Generate step-by-step question.
   */
  generateStepQuestion(
    flow: string,
    step: string,
    context?: Record<string, any>,
  ): {
    text: string;
    buttons?: Array<{ label: string; action: string; value?: any }>;
  } {
    // Booking flow steps
    if (flow === 'booking') {
      switch (step) {
        case 'select_service':
          return {
            text: 'What do you need help with?',
            buttons: [
              { label: '🏠 Home Cleaning', action: 'select_service', value: 'cleaning' },
              { label: '📦 Moving Help', action: 'select_service', value: 'moving' },
              { label: '♻️ Recycling', action: 'select_service', value: 'recycling' },
            ],
          };

        case 'enter_address':
          return {
            text: `Where should the ${context?.service} take place?`,
            buttons: [
              { label: 'Use My Location', action: 'use_location' },
              { label: 'Enter Address', action: 'enter_address' },
            ],
          };

        case 'select_date':
          return {
            text: 'When would you like the service?',
            buttons: [
              { label: 'Today', action: 'select_date', value: 'today' },
              { label: 'Tomorrow', action: 'select_date', value: 'tomorrow' },
              { label: 'Choose Date', action: 'select_date', value: 'custom' },
            ],
          };

        case 'confirm_booking':
          return {
            text: `Review your booking:\n\n${context?.service}\n📍 ${context?.address}\n📅 ${context?.date} at ${context?.time}\n💰 €${context?.price}\n\nLooks good?`,
            buttons: [
              { label: '✅ Confirm', action: 'confirm_booking' },
              { label: '✏️ Edit', action: 'edit_booking' },
              { label: '❌ Cancel', action: 'cancel_booking' },
            ],
          };
      }
    }

    return {
      text: 'How can I help you?',
    };
  }

  /**
   * Get all available templates (for debugging).
   */
  getAllTemplates(): Record<string, any> {
    return this.TEMPLATES;
  }
}
