import { useAdmin } from "@/contexts/AdminContext";
import { useAuth } from "@/hooks/useAuth";
import { Palette } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AdminAccessModal } from "./admin-access-modal";
import { ColorPickerPopover } from "./color-picker-popover";

interface AdminControlsProps {
  onAddClick?: () => void;
  variant?: "header" | "floating" | "glass";
  themeColor?: string;
  onThemeColorChange?: (color: string) => void;
  promoterId?: string;
}

export const AdminControls = ({
  onAddClick,
  variant = "header",
  themeColor,
  onThemeColorChange,
  promoterId,
}: AdminControlsProps) => {
  const { isAdmin, setIsAdmin, canAccessPromoter, canAccessEvent } = useAdmin();
  const { user } = useAuth(); // Get user state to check if signed in
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // User must be signed in to have admin access
  const isSignedIn = !!user;

  console.log("[ADMIN-CONTROLS] 🎛️ Component props:", {
    promoterId,
    isSignedIn,
    isAdmin,
  });

  // Check if user has access to this promoter
  const hasResourceAccess = promoterId ? canAccessPromoter(promoterId) : false;

  console.log("[ADMIN-CONTROLS] 🔐 Final access:", {
    isSignedIn,
    isAdmin,
    hasResourceAccess,
    promoterId,
  });

  const hasAdminAccess = isSignedIn && isAdmin && hasResourceAccess;

  console.log("[ADMIN-CONTROLS] 🎨 hasAdminAccess:", hasAdminAccess);
  console.log("[ADMIN-CONTROLS] 🎨 Should show button:", hasAdminAccess && !!onThemeColorChange);

  const handleAdminSuccess = () => {
    setShowAdminModal(false);
    setIsAdmin(true);
  };

  const handleColorChange = (color: string) => {
    if (onThemeColorChange) {
      onThemeColorChange(color);
    }
  };

  const getButtonStyle = () => {
    const base = {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    };

    if (hasAdminAccess) {
      return { ...base, backgroundColor: "#22c55e" };
    }
    return base;
  };

  return (
    <>
      <View style={styles.container}>
        {/* Show color picker button when admin has access */}
        {hasAdminAccess && onThemeColorChange && (
          <ColorPickerPopover
            isOpen={showColorPicker}
            onOpenChange={setShowColorPicker}
            currentColor={themeColor || "160 84% 39%"}
            onColorChange={handleColorChange}
          >
            <TouchableOpacity
              style={getButtonStyle()}
              onPress={() => setShowColorPicker(true)}
            >
              <Palette
                size={16}
                color={hasAdminAccess ? "#0a0a0a" : "#fafafa"}
              />
            </TouchableOpacity>
          </ColorPickerPopover>
        )}
        
        {/* Show disabled/locked button when signed in, admin, but no resource access */}
        {isSignedIn && isAdmin && !hasResourceAccess && onThemeColorChange && promoterId && (
          <TouchableOpacity
            style={[getButtonStyle(), { opacity: 0.5 }]}
            disabled={true}
          >
            <Palette
              size={16}
              color="#fafafa"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Only show modal if signed in but admin is NOT logged in */}
      {isSignedIn && !isAdmin && (
        <AdminAccessModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onSuccess={handleAdminSuccess}
          actionType="manage"
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
