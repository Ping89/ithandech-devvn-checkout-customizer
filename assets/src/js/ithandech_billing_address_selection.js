jQuery(document).ready(function($) {

    // Các biến trạng thái cục bộ cho từng tab (không chia sẻ qua localStorage)
    let currentProvinceForDistrict = null;
    let currentDistrictForWard = null;
    let currentProvinceForPayment = null;

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
    function ithandechPopulateDistrictSelect(data) {
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

    function ithandechPopulateWardSelect(data) {
        $wardSelect.empty();
        $.each(data, function(wardCode, wardName) {
            $wardSelect.append(
                $('<option></option>').val(wardCode).text(wardName)
            );
        });
    }

    // --- Sự kiện cho selectbox Tỉnh/Thành ---
    $provinceSelect.on('change', function() {
        var provinceCode = $(this).val();
        // alert('okkkk');

        // Nếu không chọn tỉnh nào, reset các select liên quan
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

        // Khi tỉnh thay đổi, reset các selectbox Quận/Huyện và Xã/Phường
        currentDistrictForWard = null;
        $districtSelect.empty().append(
            $('<option></option>').val('').text('Chọn quận/huyện/t.x')
        );
        $wardSelect.empty().append(
            $('<option></option>').val('').text('Chọn xã/phường')
        );

        // Lấy mã quốc gia từ trường hidden
        var billingCountry = $('#billing_country').val();

        // Nếu mã tỉnh mới khác với mã đã hiển thị phương thức thanh toán, gọi hàm ithanLoadPaymentMethods với mã quốc gia và mã tỉnh
        if (currentProvinceForPayment !== provinceCode) {
            if (typeof ithandechLoadPaymentMethods === 'function') {
                ithandechLoadPaymentMethods(billingCountry, provinceCode);
                currentProvinceForPayment = provinceCode;
            }
        }
        
    });

    // --- Sự kiện cho selectbox Quận/Huyện ---
    // 1. Sự kiện click vào selectbox Quận/Huyện:
    $districtSelect.on('click', function() {
        
        var selectedProvince = $provinceSelect.val();
        if (!selectedProvince) {
            return;
        }
        // Lấy mã quốc gia từ trường hidden
        var billingCountry = $('#billing_country').val();
        // Kiểm tra phương thức thanh toán: nếu mã tỉnh chưa khớp, gọi hàm
        if (currentProvinceForPayment !== selectedProvince) {
            if (typeof ithandechLoadPaymentMethods === 'function') {
                ithandechLoadPaymentMethods(billingCountry, selectedProvince);
                currentProvinceForPayment = selectedProvince;
            }
        }
        // Kiểm tra cache danh sách Quận/Huyện theo tỉnh
        if (currentProvinceForDistrict !== selectedProvince) {
            if (provinceDistrictData.hasOwnProperty(selectedProvince) &&
                provinceDistrictData[selectedProvince].loaded) {
                ithandechPopulateDistrictSelect(provinceDistrictData[selectedProvince].data);
                currentProvinceForDistrict = selectedProvince;
                ithandechSaveCache();
            } else {
                $.ajax({
                    url: ithandech_billing_address_ajax_obj.ajaxurl,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        action: 'ithandech_load_districts', 
                        province_code: selectedProvince
                    },
                    beforeSend: function() {
                        // 1. Thay thế nội dung bằng "Đang tải..."
                        $districtSelect.empty().append(
                            $('<option></option>').val('').text('Đang tải...')
                        );
                    },
                    success: function(response) {
                        provinceDistrictData[selectedProvince] = {
                            loaded: true,
                            data: response
                        };
                        ithandechPopulateDistrictSelect(response);
                        currentProvinceForDistrict = selectedProvince;
                        ithandechSaveCache();
                    },
                    error: function() {
                        alert('Không thể tải danh sách quận/huyện. Vui lòng thử lại!');
                    }
                });
            }
        }
    });

    // 2. Sự kiện change của selectbox Quận/Huyện (để load danh sách Xã/Phường):
    $districtSelect.on('change', function() {
        let selectedProvince = $provinceSelect.val();
        let districtCode = $(this).val();

        if (!districtCode) {
            $wardSelect.empty().append(
                $('<option></option>').val('').text('Chọn xã/phường')
            );
            currentDistrictForWard = null;
            return;
        }

        // Kiểm tra cache danh sách Xã/Phường theo cặp (tỉnh, quận)
        if (wardData[selectedProvince] &&
            wardData[selectedProvince][districtCode] &&
            wardData[selectedProvince][districtCode].loaded) {
            ithandechPopulateWardSelect(wardData[selectedProvince][districtCode].data);
            currentDistrictForWard = districtCode;
            ithandechSaveCache();
        } else {
            $.ajax({
                url: ithandech_billing_address_ajax_obj.ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'ithandech_load_wards',
                    district_code: districtCode
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
                    wardData[selectedProvince][districtCode] = {
                        loaded: true,
                        data: response
                    };
                    ithandechPopulateWardSelect(response);
                    currentDistrictForWard = districtCode;
                    ithandechSaveCache();
                },
                error: function() {
                    alert('Không thể tải danh sách xã/phường. Vui lòng thử lại!');
                }
            });
        }
    });

    // --- Sự kiện cho selectbox Xã/Phường ---
    $wardSelect.on('click', function() {
        var selectedProvince = $provinceSelect.val();
        var selectedDistrict = $districtSelect.val();
        if (!selectedDistrict) {
            return;
        }
        if (currentDistrictForWard !== selectedDistrict) {
            if (wardData[selectedProvince] &&
                wardData[selectedProvince][selectedDistrict] &&
                wardData[selectedProvince][selectedDistrict].loaded) {
                ithandechPopulateWardSelect(wardData[selectedProvince][selectedDistrict].data);
                currentDistrictForWard = selectedDistrict;
                ithandechSaveCache();
            } else {
                $.ajax({
                    url: ithandech_billing_address_ajax_obj.ajaxurl,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        action: 'ithandech_load_wards',
                        district_code: selectedDistrict
                    },
                    beforeSend: function() {
                        // Hiển thị "Đang tải..." trên select Xã/Phường
                        var $wardSelect = $('#address-billing_ward');
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
                        ithandechPopulateWardSelect(response);
                        currentDistrictForWard = selectedDistrict;
                        ithandechSaveCache();
                    },
                    error: function() {
                        alert('Không thể tải danh sách xã/phường. Vui lòng thử lại!');
                    }
                });
            }
        }
    });      
});


// Nếu hàm ithandechLoadPaymentMethods chưa được định nghĩa (plugin khác sẽ định nghĩa), fake hàm này.
// if (typeof ithandechLoadPaymentMethods !== 'function') {
//     function ithandechLoadPaymentMethods(countryCode, provinceCode) {
//         alert('Đang gọi phương thức thanh toán cho quốc gia: ' + countryCode + ' và tỉnh: ' + provinceCode);
//     }
// }
