import { colors } from '@/common/colors';
import React, { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

interface CardStyle {
    containerStyle?: ViewStyle;
    children: ReactNode;
}

const Card = ({ containerStyle, children }: CardStyle) => {
    return <View style={[styles.container, containerStyle]}>{children}</View>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        elevation: 6,
        shadowRadius: 6,
        borderRadius: 12,
        shadowOpacity: 0.08,
        paddingHorizontal: 16,
        backgroundColor: colors.white,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowColor: colors.cardShadow,
    },
});

export default Card;
