jQuery(document).ready(function($) {

    // Các biến trạng thái cục bộ cho từng tab (không chia sẻ qua localStorage)
    
    let currentProvinceForDistrict = null;
    let currentDistrictForWard = null;

    // Cache dữ liệu (chỉ chia sẻ dữ liệu danh sách, không chia sẻ lựa chọn đang được chọn)
    let provinceDistrictData = JSON.parse(localStorage.getItem('provinceDistrictData')) || {};
    let wardData = JSON.parse(localStorage.getItem('wardData')) || {};

    let $provinceSelect = $('#address-billing_state');
    let $districtSelect = $('#address-billing_city');
    let $wardSelect = $('#address-billing_ward');

    // Hàm lưu cache (chỉ lưu provinceDistrictData và wardData)
    function ithandechSaveCache() {
        localStorage.setItem('provinceDistrictData', JSON.stringify(provinceDistrictData));
        localStorage.setItem('wardData', JSON.stringify(wardData));
    }

    // Lắng nghe sự kiện storage để cập nhật cache từ các tab khác
    window.addEventListener('storage', function(e) {
        if (e.key === 'provinceDistrictData') {
            provinceDistrictData = JSON.parse(e.newValue) || {};
        }
        if (e.key === 'wardData') {
            wardData = JSON.parse(e.newValue) || {};
        }
    });

    // --- Các hàm hỗ trợ load dữ liệu vào select box ---
    function populateDistrictSelect(data) {
        $districtSelect.empty();
        $.each(data, function(districtCode, districtName) {
            $districtSelect.append(
                $('<option></option>').val(districtCode).text(districtName)
            );
        });
        // Sau khi load danh sách Quận/Huyện, reset selectbox Xã/Phường
        $wardSelect.empty().append(
            $('<option></option>').val('').text('Chọn xã/phường')
        );
    }

    function populateWardSelect(data) {
        $wardSelect.empty();
        $.each(data, function(wardCode, wardName) {
            $wardSelect.append(
                $('<option></option>').val(wardCode).text(wardName)
            );
        });
    }

    /**
    * Hàm tải danh sách Quận/Huyện cho 1 tỉnh, dùng chung cho:
    * - Sự kiện change (người dùng chọn tỉnh)
    * - Tự động load khi trang mở nếu đã có sẵn giá trị
    */
   function loadDistrictsByProvince(provinceCode) {
        // Nếu không có provinceCode, reset & thoát
        // Lấy select Quận/Huyện

        if (!provinceCode) {
            $districtSelect.empty().append(
                $('<option></option>').val('').text('Chọn quận/huyện/t.x')
            );
            $wardSelect.empty().append(
                $('<option></option>').val('').text('Chọn xã/phường')
            );
            currentProvinceForDistrict = null;
            currentProvinceForPayment = null;
            return;
        }

        // Reset Quận/Huyện & Xã/Phường
        currentDistrictForWard = null;
        $districtSelect.empty().append(
            $('<option></option>').val('').text('Chọn quận/huyện/t.x')
        );
        $wardSelect.empty().append(
            $('<option></option>').val('').text('Chọn xã/phường')
        );

        // Lấy mã quốc gia
        let billingCountry = $('#billing_country').val();

        // Gọi hàm load payment method nếu tỉnh thay đổi
        if (currentProvinceForPayment !== provinceCode) {
            if (typeof ithandechLoadPaymentMethods === 'function') {
                ithandechLoadPaymentMethods(billingCountry, provinceCode);
            }
            currentProvinceForPayment = provinceCode;
        }

        // Gọi Ajax hoặc lấy từ cache
        $.ajax({
            url: ithandech_billing_address_ajax_obj.ajaxurl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'ithandech_load_districts',
                province_code: provinceCode,
                nonce: ithandech_billing_address_ajax_obj.nonce,
            },
            beforeSend: function() {
                // 1. Thay thế nội dung bằng "Đang tải..."
                $districtSelect.empty().append(
                    $('<option></option>').val('').text('Đang tải...')
                );
            },
            success: function(response) {
                provinceDistrictData[provinceCode] = {
                    loaded: true,
                    data: response
                };
                populateDistrictSelect(response);
                currentProvinceForDistrict = provinceCode;
                ithandechSaveCache();
                $districtSelect.trigger('click');
            },
            error: function() {
                alert('Không thể tải danh sách quận/huyện. Vui lòng thử lại!');
            }
        });
    }

    // --- Sự kiện cho selectbox Tỉnh/Thành ---
    $(document).on('change', '#address-billing_state', function() {

        let provinceCode = $(this).val();
       // Gọi hàm loadDistrictsByProvince
       loadDistrictsByProvince(provinceCode);
    });

    function popup_address_billing_city(selectedProvince) {
        // var selectedProvince = $('#address-billing_state').val();
        if (!selectedProvince) return;
 
        var billingCountry = $('#billing_country').val();
        if (currentProvinceForPayment !== selectedProvince) {
            if (typeof ithandechLoadPaymentMethods === 'function') {
                ithandechLoadPaymentMethods(billingCountry, selectedProvince);
            }
            currentProvinceForPayment = selectedProvince;
        }
 
        if (currentProvinceForDistrict !== selectedProvince) {
            if (provinceDistrictData[selectedProvince] &&
                provinceDistrictData[selectedProvince].loaded) {
                populateDistrictSelect(provinceDistrictData[selectedProvince].data);
                currentProvinceForDistrict = selectedProvince;
                ithandechSaveCache();
            } else {
                 // Lấy select Quận/Huyện
                $.ajax({
                    url: ithandech_billing_address_ajax_obj.ajaxurl,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        action: 'ithandech_load_districts',
                        province_code: selectedProvince,
                        nonce: ithandech_billing_address_ajax_obj.nonce,
                    },
                    beforeSend: function() {
                         // 1. Thay thế nội dung bằng "Đang tải..."
                         $districtSelect.empty().append(
                             $('<option></option>').val('').text('Đang tải...')
                         );
                         // 2. Đóng Select2 để người dùng thấy đang tải (hoặc có thể tắt popup)
                         $districtSelect.select2('close');
                     },
                    success: function(response) {
                        provinceDistrictData[selectedProvince] = {
                            loaded: true,
                            data: response
                        };
                        populateDistrictSelect(response);
                        currentProvinceForDistrict = selectedProvince;
                        ithandechSaveCache();
                    },
                    error: function() {
                        alert('Không thể tải danh sách quận/huyện. Vui lòng thử lại!');
                    }
                });
            }
        }
    }

    // --- Sự kiện cho selectbox Quận/Huyện ---
    // 1. Sự kiện click vào selectbox Quận/Huyện:
    $(document).on('click', '#address-billing_city', function() {
        let selectedProvince = $provinceSelect.val();
        popup_address_billing_city(selectedProvince);
    });

    // 2. Sự kiện change của selectbox Quận/Huyện (để load danh sách Xã/Phường):
    $(document).on('change', '#address-billing_city', function() {
        let selectedProvince = $provinceSelect.val();
        popup_address_billing_city(selectedProvince);
    });

    /****************************************
    * 4) XÃ/PHƯỜNG
    ****************************************/
   function popup_address_billing_ward() {
        let selectedProvince = $provinceSelect.val();
        let selectedDistrict = $districtSelect.val();
        if (!selectedDistrict) return;

        if (currentDistrictForWard !== selectedDistrict) {
            if (wardData[selectedProvince] &&
                wardData[selectedProvince][selectedDistrict] &&
                wardData[selectedProvince][selectedDistrict].loaded) {
                populateWardSelect(wardData[selectedProvince][selectedDistrict].data);
                currentDistrictForWard = selectedDistrict;
                ithandechSaveCache();
            } else {
                $.ajax({
                    url: ithandech_billing_address_ajax_obj.ajaxurl,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        action: 'ithandech_load_wards',
                        district_code: selectedDistrict,
                        nonce: ithandech_billing_address_ajax_obj.nonce,
                    },
                    beforeSend: function() {
                        // Hiển thị "Đang tải..." trên select Xã/Phường
                        $wardSelect.empty().append(
                            $('<option></option>').val('').text('Đang tải...')
                        );
                    },
                    success: function(response) {
                        if (!wardData[selectedProvince]) {
                            wardData[selectedProvince] = {};
                        }
                        wardData[selectedProvince][selectedDistrict] = {
                            loaded: true,
                            data: response
                        };
                        populateWardSelect(response);
                        currentDistrictForWard = selectedDistrict;
                        ithandechSaveCache();
                    },
                    error: function() {
                        alert('Không thể tải danh sách xã/phường. Vui lòng thử lại!');
                    }
                });
            }
        }
    }

    // $('#address-billing_ward').on('select2:open', function(e) {
    //     popup_address_billing_ward();
    // });
    $(document).on('open', '#address-billing_ward select', function() {
        popup_address_billing_ward();
    });

    // --- Sự kiện cho selectbox Xã/Phường ---
    $(document).on('click', '#address-billing_ward', function() {
        popup_address_billing_ward();
    });

    /****************************************
    * 6) ẨN TOOLTIP KHI FOCUS / CHANGE
    ****************************************/
    $(document).ready(function() {
        $(document)
            .on('focus change', '#billing_last_name, #billing_province_code, #billing_district_code, #address-billing_ward, #billing_address_2, #billing_phone, #billing_email', function() {
                $(this).closest('.input-container').find('span.error').hide();
            });
    });

    $(document).on('input', '.ithan-buy-now-qty', function() {
        var value = parseInt($(this).val(), 10);
        
        // Kiểm tra và điều chỉnh nếu giá trị nhỏ hơn 1
        if (value < 1) {
            $(this).val(1);  // Đặt lại giá trị thành 1
        }
    });
});

var currentProvinceForPayment = null;

if (typeof ithanSetCurrentProvinceForPayment !== 'function') {
    function ithanSetCurrentProvinceForPayment(value_province_code) {
        currentProvinceForPayment = value_province_code;
    }
}
