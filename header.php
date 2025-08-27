<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, maximum-scale=1, minimum-scale=1">
    <meta http-equiv="Content-Security-Policy"
          content="
            default-src 'self';
            script-src 'self' 'unsafe-inline' https:;
            style-src  'self' 'unsafe-inline' https:;
            img-src    'self' data: https:;
            media-src  'self' https: blob:;
            connect-src 'self' https:;
            frame-ancestors 'none';
            upgrade-insecure-requests">
    <meta name="theme-color" content="#000000">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
