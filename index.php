<?php
/**
 * The main template file for the Ting Tong theme.
 *
 * This file simply loads and displays the content of the main index.html
 * which contains the single-page application. This approach helps in
 * decoupling the app from the WordPress theme structure.
 *
 * @package TingTong
 */

// We are telling the browser that this is a HTML document.
header( 'Content-Type: text/html; charset=utf-8' );

// Construct the full path to index.html within the theme directory.
$app_path = get_template_directory() . '/index.html';

// Check if the file exists to avoid errors.
if ( file_exists( $app_path ) ) {
	// Read and output the content of index.html.
	echo file_get_contents( $app_path );
} else {
	// If the file is missing, display an error message.
	wp_die( 'Error: Application file (index.html) not found.' );
}
