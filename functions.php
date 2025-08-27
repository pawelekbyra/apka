<?php
/**
 * Plik functions.php dla motywu Ting Tong.
 *
 * Zawiera całą logikę backendową dla aplikacji opartej na WordPressie.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Zabezpieczenie przed bezpośrednim dostępem.
}

// =========================================================================
// 1. SYSTEM POLUBIEŃ (Tabela + Funkcje pomocnicze)
// =========================================================================

/**
 * Tworzy tabelę do przechowywania polubień.
 */
function tt_likes_create_table() {
	global $wpdb;

	$table_name      = $wpdb->prefix . 'tt_likes';
	$charset_collate = $wpdb->get_charset_collate();

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';

	$sql = "CREATE TABLE {$table_name} (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		item_id BIGINT UNSIGNED NOT NULL,
		user_id BIGINT UNSIGNED NOT NULL,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		UNIQUE KEY uniq_user_item (user_id, item_id),
		KEY idx_item (item_id)
	) {$charset_collate};";

	dbDelta( $sql );
	update_option( 'tt_likes_db_version', '1.0' );
}
add_action( 'after_switch_theme', 'tt_likes_create_table' );

/** Fallback: upewnij się, że tabela istnieje. */
add_action( 'init', function () {
	if ( get_option( 'tt_likes_db_version' ) !== '1.0' ) {
		tt_likes_create_table();
	}
} );

/**
 * Pobiera liczbę polubień dla elementu.
 */
function tt_likes_get_count( $item_id ) {
	global $wpdb;

	return (int) $wpdb->get_var(
		$wpdb->prepare(
			"SELECT COUNT(*) FROM {$wpdb->prefix}tt_likes WHERE item_id = %d",
			$item_id
		)
	);
}

/**
 * Sprawdza, czy użytkownik polubił element.
 */
function tt_likes_user_has( $item_id, $user_id ) {
	if ( ! $user_id ) {
		return false;
	}

	global $wpdb;

	return (bool) $wpdb->get_var(
		$wpdb->prepare(
			"SELECT COUNT(*) FROM {$wpdb->prefix}tt_likes WHERE item_id = %d AND user_id = %d",
			$item_id,
			$user_id
		)
	);
}

// =========================================================================
// 2. PRZYGOTOWANIE I PRZEKAZANIE DANYCH DO JAVASCRIPT
// =========================================================================

/**
 * Pobiera dane slajdów, które zostaną przekazane do frontendu.
 */
function tt_get_slides_data() {
	$user_id = get_current_user_id(); // 0 jeśli gość

	// Symulujemy pobieranie postów z bazy danych
	$simulated_posts = [
		[
			'post_id'      => 1,
			'post_title'   => 'Paweł Polutek',
			'post_content' => 'To jest dynamicznie załadowany opis dla pierwszego slajdu. Działa!',
			'video_url'    => 'https://pawelperfect.pl/wp-content/uploads/2025/07/17169505-hd_1080_1920_30fps.mp4',
			'access'       => 'public',
			'comments'     => 567,
			'avatar'       => 'https://i.pravatar.cc/100?u=pawel',
		],
		[
			'post_id'      => 2,
			'post_title'   => 'Web Dev',
			'post_content' => 'Kolejny slajd, kolejne wideo. #efficiency',
			'video_url'    => 'https://pawelperfect.pl/wp-content/uploads/2025/07/4434150-hd_1080_1920_30fps-1.mp4',
			'access'       => 'public',
			'comments'     => 1245,
			'avatar'       => 'https://i.pravatar.cc/100?u=webdev',
		],
		[
			'post_id'      => 3,
			'post_title'   => 'Tajemniczy Tester',
			'post_content' => 'Ten slajd jest tajny! 🤫',
			'video_url'    => 'https://pawelperfect.pl/wp-content/uploads/2025/07/4678261-hd_1080_1920_25fps.mp4',
			'access'       => 'secret',
			'comments'     => 2,
			'avatar'       => 'https://i.pravatar.cc/100?u=tester',
		],
		[
			'post_id'      => 4,
			'post_title'   => 'Artysta AI',
			'post_content' => 'Generowane przez AI, renderowane przez przeglądarkę. #future',
			'video_url'    => 'https://pawelperfect.pl/wp-content/uploads/2025/07/AdobeStock_631182722-online-video-cutter.com_.mp4',
			'access'       => 'public',
			'comments'     => 890,
			'avatar'       => 'https://i.pravatar.cc/100?u=ai-artist',
		],
	];

	$slides_data = [];

	foreach ( $simulated_posts as $post ) {
		$slides_data[] = [
			'id'              => 'slide-' . str_pad( $post['post_id'], 3, '0', STR_PAD_LEFT ),
			'likeId'          => (string) $post['post_id'],
			'user'            => $post['post_title'],
			'description'     => $post['post_content'],
			'mp4Url'          => $post['video_url'],
			'hlsUrl'          => null,
			'poster'          => '',
			'avatar'          => $post['avatar'],
			'access'          => $post['access'],
			'initialLikes'    => tt_likes_get_count( $post['post_id'] ),
			'isLiked'         => tt_likes_user_has( $post['post_id'], $user_id ),
			'initialComments' => $post['comments'],
		];
	}

	return $slides_data;
}

/**
 * Dodaje skrypty i lokalizuje dane dla frontendu.
 */
function tt_enqueue_and_localize_scripts() {
	// Właściwe kolejkowanie stylów i skryptów
	wp_enqueue_style(
		'tt-main-style',
		get_template_directory_uri() . '/assets/css/style.css',
		[],
		null // Wersja może być dodana później, np. filemtime() dla cache-busting
	);

	wp_enqueue_script(
		'tt-main-app',
		get_template_directory_uri() . '/assets/js/app.js',
		[],   // Zależności (np. 'jquery')
		null, // Wersja
		true  // Ładowanie w stopce
	);

	// Dane przekazywane do skryptu 'tt-main-app'
	wp_localize_script(
		'tt-main-app',
		'TingTongData',
		[
			'isLoggedIn' => is_user_logged_in(),
			'slides'     => tt_get_slides_data(),
		]
	);

	wp_localize_script(
		'tt-main-app',
		'ajax_object',
		[
			'ajax_url' => admin_url( 'admin-ajax.php' ),
			'nonce'    => wp_create_nonce( 'tt_ajax_nonce' ),
		]
	);
}
add_action( 'wp_enqueue_scripts', 'tt_enqueue_and_localize_scripts' );

// =========================================================================
// 3. HANDLERY AJAX (Logowanie, Wylogowanie, Lajkowanie i Nonce)
// =========================================================================

/**
 * Handler AJAX do pobierania zaktualizowanych danych slajdów.
 * Wywoływany przez JS po zalogowaniu, aby zsynchronizować stan polubień.
 */
function tt_get_slides_data_ajax_handler() {
	check_ajax_referer( 'tt_ajax_nonce', 'nonce' );

	// Używamy istniejącej funkcji, która już poprawnie pobiera dane dla zalogowanego użytkownika
	wp_send_json_success( tt_get_slides_data() );
}
// Dostępne tylko dla zalogowanych użytkowników (wp_ajax_...)
add_action( 'wp_ajax_tt_get_slides_data_ajax', 'tt_get_slides_data_ajax_handler' );

/** Handler AJAX do przełączania polubienia. */
add_action( 'wp_ajax_toggle_like', function () {
	check_ajax_referer( 'tt_ajax_nonce', 'nonce' );

	if ( ! is_user_logged_in() ) {
		wp_send_json_error( [ 'message' => 'Musisz się zalogować, aby polubić.' ], 401 );
	}

	$item_id = isset( $_POST['post_id'] ) ? absint( $_POST['post_id'] ) : 0;

	if ( ! $item_id ) {
		wp_send_json_error( [ 'message' => 'Brak ID elementu.' ], 400 );
	}

	$user_id    = get_current_user_id();
	global $wpdb;
	$table_name = $wpdb->prefix . 'tt_likes';

	if ( tt_likes_user_has( $item_id, $user_id ) ) {
		$wpdb->delete(
			$table_name,
			[
				'item_id' => $item_id,
				'user_id' => $user_id,
			]
		);
		$status = 'unliked';
	} else {
		$wpdb->insert(
			$table_name,
			[
				'item_id' => $item_id,
				'user_id' => $user_id,
			]
		);
		$status = 'liked';
	}

	wp_send_json_success(
		[
			'status' => $status,
			'count'  => tt_likes_get_count( $item_id ),
		]
	);
} );

/** Handler AJAX do logowania. */
add_action( 'wp_ajax_nopriv_tt_ajax_login', function () {
	check_ajax_referer( 'tt_ajax_nonce', 'nonce' );

	$credentials = [
		'user_login'    => isset( $_POST['log'] ) ? sanitize_user( $_POST['log'] ) : '',
		'user_password' => isset( $_POST['pwd'] ) ? $_POST['pwd'] : '',
		'remember'      => true,
	];

	$user = wp_signon( $credentials, is_ssl() );

	if ( is_wp_error( $user ) ) {
		wp_send_json_error( [ 'message' => 'Błędne dane logowania.' ] );
	} else {
		wp_set_current_user( $user->ID );
		wp_set_auth_cookie( $user->ID, true, is_ssl() );
		wp_send_json_success( [ 'message' => 'Zalogowano pomyślnie.' ] );
	}
} );

/** Handler AJAX do wylogowania bez przeładowania strony. */
add_action( 'wp_ajax_tt_ajax_logout', function () {
	check_ajax_referer( 'tt_ajax_nonce', 'nonce' );
	wp_logout();
	wp_send_json_success( [ 'message' => 'Wylogowano pomyślnie.' ] );
} );

/**
 * Handler AJAX do odświeżania nonca po zmianie stanu logowania.
 * Zwraca bezpośredni, prosty JSON, aby uniknąć niejasności.
 */
function tt_refresh_nonce_handler() {
	header( 'Content-Type: application/json; charset=utf-8' );

	echo json_encode(
		[
			'success' => true,
			'nonce'   => wp_create_nonce( 'tt_ajax_nonce' ),
		]
	);

	wp_die();
}
add_action( 'wp_ajax_tt_refresh_nonce', 'tt_refresh_nonce_handler' );
add_action( 'wp_ajax_nopriv_tt_refresh_nonce', 'tt_refresh_nonce_handler' );

// =========================================================================
// 4. NIESTANDARDOWE SHORTCODE'Y I FORMULARZE
// =========================================================================

/**
 * Shortcode [tt_login_form] generujący formularz dla AJAX.
 */
function tt_login_form_shortcode() {
	if ( is_user_logged_in() ) {
		return '<p style="padding: 20px; text-align: center;">Jesteś już zalogowany.</p>';
	}

	// Formularz z action="#" aby JS mógł przejąć submit.
	return '
	<form name="loginform" class="login-form" action="#" method="post">
		<p class="login-username">
			<label for="user_login">Nazwa użytkownika lub e-mail</label>
			<input type="text" name="log" id="user_login" class="input" value="" size="20" required autocomplete="username">
		</p>
		<p class="login-password">
			<label for="user_pass">Hasło</label>
			<input type="password" name="pwd" id="user_pass" class="input" value="" size="20" required autocomplete="current-password">
		</p>
		<p class="login-submit">
			<input type="submit" name="wp-submit" id="wp-submit" class="button button-primary" value="Zaloguj się">
		</p>
	</form>';
}
add_shortcode( 'tt_login_form', 'tt_login_form_shortcode' );
