# UI Enhancements Documentation

## 🎨 New Components Added

### 1. Bottom Sheets (Modal Replacement)

Replace traditional modals with smooth, native-feeling bottom sheets.

**Components:**

- `components/ui/bottom-sheet.tsx` - Base bottom sheet component
- `components/login-bottom-sheet.tsx` - Login modal as bottom sheet
- `components/event-details-bottom-sheet.tsx` - Event details modal

**Usage:**

```tsx
import { LoginBottomSheet } from "./components/login-bottom-sheet";

// In your component
const handleLogin = async (email: string, password: string) => {
  // Your login logic
  return true;
};

<LoginBottomSheet onLogin={handleLogin} isLoading={false} error={null} />;
```

**Features:**

- Drag to close
- Multiple snap points (25%, 50%, 90%)
- Backdrop blur support
- Smooth animations

---

### 2. Skeleton Loaders

Show loading states with animated skeleton screens.

**Components:**

- `components/ui/skeleton-loader.tsx` - All skeleton components

**Available Skeletons:**

- `EventCardSkeleton` - For event cards
- `PromoterCardSkeleton` - For promoter cards
- `ListItemSkeleton` - For list items
- `SkeletonLoader` - Base skeleton component

**Usage:**

```tsx
import { EventCardSkeleton } from "./components/ui/skeleton-loader";

{
  isLoading ? (
    <EventCardSkeleton colorMode="light" />
  ) : (
    <EventCard {...eventData} />
  );
}
```

---

### 3. Enhanced Animations

Smooth, performant animations using Moti.

**Components:**

- `components/ui/animated-card.tsx` - Animation utilities

**Animation Types:**

- `AnimatedCard` - Pressable card with animations
- `FadeInView` - Fade in on mount
- `SlideInView` - Slide in from direction

**Usage:**

```tsx
import { AnimatedCard, FadeInView, SlideInView } from './components/ui/animated-card';

// Animated card with press effect
<AnimatedCard
  animationType="lift" // 'scale' | 'lift' | 'spring' | 'slide'
  onPress={() => console.log('pressed')}
  hapticFeedback={true}
  delay={0}
>
  <Text>Content</Text>
</AnimatedCard>

// Fade in animation
<FadeInView delay={100} duration={500}>
  <Text>Fades in smoothly</Text>
</FadeInView>

// Slide in animation
<SlideInView direction="bottom" delay={200} distance={50}>
  <Text>Slides up from bottom</Text>
</SlideInView>
```

---

### 4. Blur Effects & Glassmorphism

Modern glassmorphism effects using expo-blur.

**Components:**

- `components/ui/blur-view-wrapper.tsx` - Blur utilities

**Available Components:**

- `BlurViewWrapper` - Wraps content with blur background
- `GlassCard` - Ready-to-use glassmorphism card

**Usage:**

```tsx
import { BlurViewWrapper, GlassCard } from './components/ui/blur-view-wrapper';

// Blur wrapper
<BlurViewWrapper
  intensity={50}
  tint="light" // 'light' | 'dark' | 'default'
  style={styles.container}
>
  <Text>Content with blurred background</Text>
</BlurViewWrapper>

// Glass card
<GlassCard intensity={30} tint="light">
  <Text>Glassmorphism card</Text>
</GlassCard>
```

---

### 5. Enhanced Event Card

Improved event card with all enhancements combined.

**Component:**

- `components/event-card-enhanced.tsx`

**Features:**

- Skeleton loading state
- Image loading placeholder
- Blur effects
- Smooth animations
- Haptic feedback

**Usage:**

```tsx
import { EventCardEnhanced } from "./components/event-card-enhanced";

<EventCardEnhanced
  id="1"
  name="Event Name"
  date="Jan 27, 2026"
  location="Venue Name"
  image="https://..."
  logo="https://..."
  isSubscribed={1}
  isLoading={false}
  delay={0}
  onPress={() => console.log("Event pressed")}
/>;
```

---

## 🚀 Quick Start

### Replace Existing Modals with Bottom Sheets

**Before:**

```tsx
<ModalComponent visible={isOpen} onClose={onClose}>
  <LoginForm />
</ModalComponent>
```

**After:**

```tsx
<LoginBottomSheet onLogin={handleLogin} isLoading={isLoading} error={error} />
```

### Add Loading States

**Before:**

```tsx
{
  events.map((event) => <EventCard {...event} />);
}
```

**After:**

```tsx
{
  isLoading ? (
    <>
      <EventCardSkeleton />
      <EventCardSkeleton />
    </>
  ) : (
    events.map((event, index) => (
      <EventCardEnhanced {...event} delay={index * 100} />
    ))
  );
}
```

### Add Entrance Animations

**Before:**

```tsx
<View style={styles.header}>
  <Text>Welcome</Text>
</View>
```

**After:**

```tsx
<FadeInView delay={0}>
  <Text>Welcome</Text>
</FadeInView>

<SlideInView direction="bottom" delay={100}>
  <Text>Smooth entrance</Text>
</SlideInView>
```

### Add Glassmorphism

**Before:**

```tsx
<View style={styles.card}>
  <Text>Card content</Text>
</View>
```

**After:**

```tsx
<GlassCard intensity={30} tint="light">
  <Text>Card content</Text>
</GlassCard>
```

---

## 📱 Live Example

See `app/ui-examples.tsx` for a comprehensive demo of all new components.

---

## 🎯 Best Practices

1. **Skeleton Loaders**: Always show skeletons during data fetching
2. **Bottom Sheets**: Use for modals that don't require full screen
3. **Animations**: Keep delays between 0-500ms for smooth sequences
4. **Blur Effects**: Use intensity 20-50 for subtle effects, 50-80 for prominent
5. **Haptic Feedback**: Enable for important user interactions

---

## 🔄 Migration Guide

### Step 1: Update Event Lists

Replace `EventCard` with `EventCardEnhanced` in your event lists.

### Step 2: Convert Modals

Convert existing modals to bottom sheets using the provided examples.

### Step 3: Add Loading States

Add skeleton loaders where you have loading states.

### Step 4: Enhance Animations

Wrap components with `FadeInView` or `SlideInView` for entrance animations.

### Step 5: Add Polish

Apply blur effects and glassmorphism to cards and overlays.

---

## 📦 Installed Packages

- `@gorhom/bottom-sheet` - Bottom sheet modals
- `moti` - Declarative animations
- `expo-blur` - Native blur effects

All packages are compatible with Expo SDK 54 and work with your existing setup (Reanimated, Tailwind, etc).
