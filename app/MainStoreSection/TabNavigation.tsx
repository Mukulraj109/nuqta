// TabNavigation.tsx - Redesigned tab navigation for MainStorePage
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
  LayoutChangeEvent,
  Platform,
} from "react-native";
import { triggerImpact } from "@/utils/haptics";
import { ThemedText } from "@/components/ThemedText";
import {
  Colors,
  Spacing,
} from "@/constants/DesignSystem";

export type TabKey = "menu" | "photos" | "reviews" | "about";

interface TabData {
  key: TabKey;
  title: string;
}

const defaultTabs: TabData[] = [
  { key: "menu", title: "Menu" },
  { key: "photos", title: "Photos" },
  { key: "reviews", title: "Reviews" },
  { key: "about", title: "About" },
];

interface TabNavigationProps {
  activeTab: TabKey;
  onTabChange: (tabKey: TabKey) => void;
  compact?: boolean;
  menuTabLabel?: string;
}

export default function TabNavigation({
  activeTab,
  onTabChange,
  compact = false,
  menuTabLabel,
}: TabNavigationProps) {
  const [containerWidth, setContainerWidth] = useState<number>(Dimensions.get("window").width);
  const [tabPositions, setTabPositions] = useState<{ [key: string]: { x: number; width: number } }>({});

  // Animated value for underline position
  const underlineLeft = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;

  // Animation refs for each tab
  const scaleAnims = useRef(defaultTabs.map(() => new Animated.Value(1))).current;

  // Override menu tab label if provided
  const tabs = menuTabLabel
    ? defaultTabs.map(t => t.key === 'menu' ? { ...t, title: menuTabLabel } : t)
    : defaultTabs;

  const tabCount = tabs.length;
  const tabWidth = containerWidth / tabCount;

  useEffect(() => {
    const activePosition = tabPositions[activeTab];
    if (activePosition) {
      Animated.parallel([
        Animated.spring(underlineLeft, {
          toValue: activePosition.x,
          useNativeDriver: false,
          tension: 100,
          friction: 12,
        }),
        Animated.spring(underlineWidth, {
          toValue: activePosition.width,
          useNativeDriver: false,
          tension: 100,
          friction: 12,
        }),
      ]).start();
    }
  }, [activeTab, tabPositions]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width || Dimensions.get("window").width;
    setContainerWidth(w);
  };

  const handleTabLayout = (key: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabPositions((prev) => ({
      ...prev,
      [key]: { x, width },
    }));
  };

  const handlePressIn = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 0.95,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = (tabKey: TabKey) => {
    triggerImpact('Light');
    onTabChange(tabKey);
  };

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      <View style={[styles.container, compact && styles.containerCompact]} onLayout={onLayout}>
        <View style={styles.tabsRow}>
          {tabs.map((tab, index) => {
            const isActive = tab.key === activeTab;

            return (
              <Animated.View
                key={tab.key}
                style={[
                  styles.tabWrapper,
                  { transform: [{ scale: scaleAnims[index] }] },
                ]}
                onLayout={(e) => handleTabLayout(tab.key, e)}
              >
                <Pressable
                  style={[styles.tab, compact && styles.tabCompact]}
                  onPress={() => handlePress(tab.key)}
                  onPressIn={() => handlePressIn(index)}
                  onPressOut={() => handlePressOut(index)}
                 
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <ThemedText
                    style={[
                      styles.label,
                      isActive && styles.labelActive,
                      compact && styles.labelCompact,
                    ]}
                  >
                    {tab.title}
                  </ThemedText>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Animated Underline */}
        <Animated.View
          style={[
            styles.underline,
            {
              left: underlineLeft,
              width: underlineWidth,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  container: {
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: Spacing.base,
  },
  tabWrapper: {
    marginRight: Spacing.lg,
  },
  tab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text.tertiary,
  },
  labelActive: {
    color: "#ffcd57",
    fontWeight: "600",
  },
  underline: {
    position: "absolute",
    bottom: 0,
    height: 3,
    backgroundColor: "#ffcd57",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  // Compact mode styles
  wrapperCompact: {
    borderBottomWidth: 0,
  },
  containerCompact: {
    paddingVertical: 0,
  },
  tabCompact: {
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  labelCompact: {
    fontSize: 14,
  },
});
