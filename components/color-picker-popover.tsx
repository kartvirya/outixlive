import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Check } from 'lucide-react-native';
import { Input } from './ui/input';

interface ColorPickerPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  children: React.ReactNode;
}

const colorPresets = [
  { name: 'White', hsl: '0 0% 100%', hex: '#FFFFFF' },
  { name: 'Emerald', hsl: '160 84% 39%', hex: '#10B981' },
  { name: 'Blue', hsl: '217 91% 60%', hex: '#3B82F6' },
  { name: 'Purple', hsl: '263 70% 50%', hex: '#8B5CF6' },
  { name: 'Pink', hsl: '330 81% 60%', hex: '#EC4899' },
  { name: 'Red', hsl: '0 72% 51%', hex: '#EF4444' },
  { name: 'Orange', hsl: '25 95% 53%', hex: '#F97316' },
  { name: 'Yellow', hsl: '45 93% 47%', hex: '#EAB308' },
  { name: 'Teal', hsl: '175 77% 40%', hex: '#14B8A6' },
  { name: 'Indigo', hsl: '239 84% 67%', hex: '#6366F1' },
  { name: 'Cyan', hsl: '190 95% 39%', hex: '#06B6D4' },
  { name: 'Lime', hsl: '84 81% 44%', hex: '#84CC16' },
];

// Convert hex to HSL
const hexToHsl = (hex: string): string => {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Convert HSL to hex
const hslToHex = (hslString: string): string => {
  const parts = hslString.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return '#10B981';

  const h = parseInt(parts[1]) / 360;
  const s = parseInt(parts[2]) / 100;
  const l = parseInt(parts[3]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const ColorPickerPopover = ({
  isOpen,
  onOpenChange,
  currentColor,
  onColorChange,
  children,
}: ColorPickerPopoverProps) => {
  const [hexInput, setHexInput] = useState(() => hslToHex(currentColor));

  useEffect(() => {
    if (currentColor) {
      setHexInput(hslToHex(currentColor));
    }
  }, [currentColor]);

  const handlePresetClick = (color: typeof colorPresets[0]) => {
    onColorChange(color.hsl);
    setHexInput(color.hex);
    onOpenChange(false);
  };

  const handleHexSubmit = () => {
    // Validate hex format
    const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    let hex = hexInput.trim();
    
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    
    if (hexRegex.test(hex)) {
      // Expand 3-digit hex to 6-digit
      if (hex.length === 4) {
        hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
      }
      const hsl = hexToHsl(hex);
      onColorChange(hsl);
      setHexInput(hex.toUpperCase());
      onOpenChange(false);
    }
  };

  return (
    <>
      {children}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => onOpenChange(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => onOpenChange(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.content}>
              <Text style={styles.title}>Theme Color</Text>

              {/* Color presets */}
              <View style={styles.presetsGrid}>
                {colorPresets.map((color) => (
                  <TouchableOpacity
                    key={color.hsl}
                    style={[
                      styles.colorButton,
                      {
                        backgroundColor: `hsl(${color.hsl})`,
                        borderColor: currentColor === color.hsl ? '#fff' : 'transparent',
                        borderWidth: currentColor === color.hsl ? 2 : 0,
                      },
                    ]}
                    onPress={() => handlePresetClick(color)}
                  >
                    {currentColor === color.hsl && (
                      <Check
                        size={20}
                        color={color.name === 'White' ? '#000' : '#fff'}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Hex input */}
              <View style={styles.hexSection}>
                <Text style={styles.hexLabel}>Custom Hex Code</Text>
                <View style={styles.hexInputRow}>
                  <Input
                    value={hexInput}
                    onChangeText={(text) => setHexInput(text.toUpperCase())}
                    onSubmitEditing={handleHexSubmit}
                    onBlur={handleHexSubmit}
                    placeholder="#000000"
                    style={styles.hexInput}
                    maxLength={7}
                  />
                  <View
                    style={[
                      styles.colorPreview,
                      { backgroundColor: `hsl(${currentColor})` },
                    ]}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexSection: {
    gap: 8,
  },
  hexLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  hexInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hexInput: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
