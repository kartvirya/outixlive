import BottomSheetLib, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, ReactNode, useCallback } from "react";
import { StyleSheet } from "react-native";

interface BottomSheetProps {
  children: ReactNode;
  snapPoints?: string[] | number[];
  enablePanDownToClose?: boolean;
  backdropComponent?: React.FC<BottomSheetBackdropProps>;
  enableBlur?: boolean;
  index?: number;
  onChange?: (index: number) => void;
  backgroundStyle?: object;
}

export const BottomSheet = forwardRef<BottomSheetLib, BottomSheetProps>(
  (
    {
      children,
      snapPoints = ["25%", "50%", "90%"],
      enablePanDownToClose = true,
      backdropComponent,
      enableBlur = false,
      index = -1,
      onChange,
      backgroundStyle,
    },
    ref,
  ) => {
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) =>
        backdropComponent ? (
          backdropComponent(props)
        ) : (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
            pressBehavior="close"
          />
        ),
      [backdropComponent],
    );

    const backgroundComponent = useCallback(() => null, []);

    return (
      <BottomSheetLib
        ref={ref}
        index={index}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={backgroundStyle || styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        onChange={onChange}
      >
        <BottomSheetView style={styles.contentContainer}>
          {children}
        </BottomSheetView>
      </BottomSheetLib>
    );
  },
);

BottomSheet.displayName = "BottomSheet";

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: "#737373",
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
