<!-- . Dopracowana dostępność, wydajność i stabilność – bez zmiany zamierzonego działania i wyglądu. -->
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <!-- PATCH: Added viewport-fit=cover for iOS PWA safe areas and disabled user zoom -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, maximum-scale=1, minimum-scale=1">
    <!-- JEDYNA ZMIANA – CSP/ABR: lekko restrykcyjny CSP (zgodny z inline) -->
    <meta http-equiv="Content-Security-Policy"
          content="
            default-src 'self';
            script-src 'self' https:;
            style-src  'self' https:;
            img-src    'self' data: https:;
            media-src  'self' https: blob:;
            connect-src 'self' https:;
            frame-ancestors 'none';
            upgrade-insecure-requests">

    <meta name="description" content="Ting Tong — pionowy feed wideo z prefetchingiem i trybem HLS/CDN-ready.">
    <meta name="theme-color" content="#000000">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Ting Tong</title>

    <!-- PATCH: iOS PWA cosmetics -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="apple-touch-icon" href="https://www.polutek.pl/wp-content/uploads/2025/07/output-onlinepngtools-1-1.png">
    <!-- PATCH: TODO - Add iOS splash screens for different devices -->
    <!--
    <link href="splash/iphone5_splash.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" rel="apple-touch-startup-image" />
    <link href="splash/iphone6_splash.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" rel="apple-touch-startup-image" />
    <link href="splash/iphoneplus_splash.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" rel="apple-touch-startup-image" />
    <link href="splash/iphonex_splash.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" rel="apple-touch-startup-image" />
    <link href="splash/iphonexr_splash.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" rel="apple-touch-startup-image" />
    <link href="splash/iphonexsmax_splash.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" rel="apple-touch-startup-image" />
    <link href="splash/ipad_splash.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" rel="apple-touch-startup-image" />
    <link href="splash/ipadpro1_splash.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" rel="apple-touch-startup-image" />
    <link href="splash/ipadpro3_splash.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" rel="apple-touch-startup-image" />
    <link href="splash/ipadpro2_splash.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" rel="apple-touch-startup-image" />
    -->

    <!-- Networking hints -->
    <link rel="preconnect" href="https://www.polutek.pl" crossorigin>
    <link rel="preconnect" href="https://i.pravatar.cc" crossorigin>
    <link rel="dns-prefetch" href="//www.polutek.pl">
    <link rel="dns-prefetch" href="//i.pravatar.cc">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
