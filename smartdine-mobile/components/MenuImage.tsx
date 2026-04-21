import React, { useState } from 'react';
import { Image, ImageProps, View, StyleSheet, Text } from 'react-native';

const FALLBACK_IMAGE = require('../assets/images/fallback-food.png');

interface MenuImageProps extends Omit<ImageProps, 'source'> {
    uri: string;
}

export default function MenuImage({ uri, style, ...props }: MenuImageProps) {
    const [error, setError] = useState(false);

    if (error || !uri) {
        return (
            <Image
                source={FALLBACK_IMAGE}
                style={style}
                {...props}
            />
        );
    }

    return (
        <Image
            source={{ uri }}
            style={style}
            onError={() => setError(true)}
            {...props}
        />
    );
}
