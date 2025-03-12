<?php

function ithandech_checkout_quick_buy_enqueue_js(): void
{
    // Đảm bảo jQuery đã có
    wp_enqueue_script( 'jquery' );
    
    // Enqueue script custom
    wp_enqueue_script(
        'ithandech-billing-address-checkout-js',
        ithandech_wc_checkout_get_assets_file("ithandech_billing_address_selection.js", "js", "", ""),
        array('jquery'), 
        '1.0', 
        true
    );

    // Truyền biến ajaxurl cho JS (nếu cần)
    wp_localize_script(
        'ithandech-billing-address-checkout-js',
        'ithandech_billing_address_ajax_obj',
        array(
            'nonce' => wp_create_nonce('ithandech_load_address_nonce'), // Tạo nonce cho AJAX
            'ajaxurl' => admin_url('admin-ajax.php')
        )
    );
}

function ithandech_wc_checkout_enqueue_script_for_popup(): void
{
    // Đảm bảo jQuery đã có
    wp_enqueue_script( 'jquery' );
    
    // Enqueue script custom
    wp_enqueue_script(
        'ithandech-billing-address-checkout-js',
        ithandech_wc_checkout_get_assets_file("ithandech_billing_address_selection_for_popup.js", "js", "", ""),
        array('jquery'), 
        '1.0', 
        true
    );

    // Truyền biến ajaxurl cho JS (nếu cần)
    wp_localize_script(
        'ithandech-billing-address-checkout-js',
        'ithandech_billing_address_ajax_obj',
        array(
            'nonce' => wp_create_nonce('ithandech_load_address_nonce'), // Tạo nonce cho AJAX
            'ajaxurl' => admin_url('admin-ajax.php')
        )
    );
}

function ithandech_wc_checkout_enqueue_js(): void
{
    // Đảm bảo jQuery đã có
    wp_enqueue_script( 'jquery' );
    
    // Enqueue script custom
    wp_enqueue_script(
        'ithandech-billing-address-checkout-js',
        ithandech_wc_checkout_get_assets_file("ithandech_billing_address_selection_for_wc_checkout_page.js", "js", "", ""),
        array('jquery'), 
        '1.0', 
        true
    );

    // Truyền biến ajaxurl cho JS (nếu cần)
    wp_localize_script(
        'ithandech-billing-address-checkout-js',
        'ithandech_billing_address_ajax_obj',
        array(
            'nonce' => wp_create_nonce('ithandech_load_address_nonce'), // Tạo nonce cho AJAX
            'ajaxurl' => admin_url('admin-ajax.php')
        )
    );
}

add_action( 'wp_enqueue_scripts', 'ithandech_checkout_quick_buy_enqueue_js_action' );
function ithandech_checkout_quick_buy_enqueue_js_action(): void
{
    if ( is_checkout() ) {
        // ithan_checkout_quick_buy_enqueue_js(); // cho ithan quick buy
        ithandech_wc_checkout_enqueue_js();
    }
}

add_action('wp_enqueue_scripts', 'ithandech_woocommerce_enqueue_css');
function ithandech_woocommerce_enqueue_css(): void
{
    if (is_checkout()){
        // Enqueue file CSS
        wp_enqueue_style(
            'ithandech-woocommerce-enqueue-css',
            ithandech_wc_checkout_get_assets_file("ithandech-devvn-woocommerce-checkout.css", "css", "", ""),
            array(), // Các dependency nếu có
            '1.0'
        );

        wp_enqueue_style(
            'ithandech-woocommerce-notices-enqueue-css',
            ithandech_wc_checkout_get_assets_file("ithandech-notices.css", "css", "", ""),
            array(), // Các dependency nếu có
            '1.0'
        );
    }
}

