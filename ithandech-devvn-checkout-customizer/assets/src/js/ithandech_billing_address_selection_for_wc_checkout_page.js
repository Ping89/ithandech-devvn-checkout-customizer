jQuery(document).ready(function($) {
    // Ẩn tooltip cũ
    $('span.error').hide();

   /****************************************
    * 1) KHAI BÁO BIẾN VÀ HÀM HỖ TRỢ
    ****************************************/
   let currentProvinceForDistrict = null;
   let currentDistrictForWard = null;
   let currentProvinceForPayment = null;

   let provinceDistrictData = JSON.parse(localStorage.getItem('provinceDistrictData')) || {};
   let wardData = JSON.parse(localStorage.getItem('wardData')) || {};

   let $provinceSelect = $('#address-billing_state');
   let $districtSelect = $('#address-billing_city');
   let $wardSelect = $('#address-billing_ward');

   function ithandechSaveCache() {
       localStorage.setItem('provinceDistrictData', JSON.stringify(provinceDistrictData));
       localStorage.setItem('wardData', JSON.stringify(wardData));
   }

   window.addEventListener('storage', function(e) {
       if (e.key === 'provinceDistrictData') {
           provinceDistrictData = JSON.parse(e.newValue) || {};
       }
       if (e.key === 'wardData') {
           wardData = JSON.parse(e.newValue) || {};
       }
   });

   function ithandechPopulateDistrictSelect(data) {
       $districtSelect.empty();
       $.each(data, function(districtCode, districtName) {
           $districtSelect.append(
               $('<option></option>').val(districtCode).text(districtName)
           );
       });
       // Reset Xã/Phường
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

   /**
    * Hàm tải danh sách Quận/Huyện cho 1 tỉnh, dùng chung cho:
    * - Sự kiện change (người dùng chọn tỉnh)
    * - Tự động load khi trang mở nếu đã có sẵn giá trị
    */
   function loadDistrictsByProvince(provinceCode) {
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
               nonce: ithandech_billing_address_ajax_obj.nonce,
               province_code: provinceCode
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
               ithandechPopulateDistrictSelect(response);
               currentProvinceForDistrict = provinceCode;
               ithandechSaveCache();
               $districtSelect.trigger('click');
           },
           error: function() {
               alert('Không thể tải danh sách quận/huyện. Vui lòng thử lại!');
           }
       });

   }

   /****************************************
    * 2) SỰ KIỆN TỈNH/THÀNH
    ****************************************/
   $provinceSelect.on('change', function() {
       let provinceCode = $(this).val();
       // Gọi hàm loadDistrictsByProvince
       loadDistrictsByProvince(provinceCode);
   });
   // chạy lần đầu lúc mới load lên
    $provinceSelect.trigger('change');

   /****************************************
    * 3) QUẬN/HUYỆN
    ****************************************/
      
   function popup_address_billing_city() {
       let selectedProvince = $provinceSelect.val();
       if (!selectedProvince) return;

       let billingCountry = $('#billing_country').val();
       if (currentProvinceForPayment !== selectedProvince) {
           if (typeof ithandechLoadPaymentMethods === 'function') {
               ithandechLoadPaymentMethods(billingCountry, selectedProvince);
           }
           currentProvinceForPayment = selectedProvince;
       }

       if (currentProvinceForDistrict !== selectedProvince) {
           if (provinceDistrictData[selectedProvince] &&
               provinceDistrictData[selectedProvince].loaded) {
               ithandechPopulateDistrictSelect(provinceDistrictData[selectedProvince].data);
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
                       nonce: ithandech_billing_address_ajax_obj.nonce
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
                       console.log(response.data);
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
   }

   // Click -> Kiểm tra cache quận/huyện (logic cũ)
   $districtSelect.on('select2:open', function() {
       popup_address_billing_city();
   });
   $districtSelect.on('click', function() {
       popup_address_billing_city();

       $wardSelect.trigger('click');
   });

   // Change -> load Xã/Phường
   $districtSelect.on('change', function() {
       let selectedProvince = $('#address-billing_state').val();
       let districtCode = $(this).val();

       if (!districtCode) {
           $wardSelect.empty().append(
               $('<option></option>').val('').text('Chọn xã/phường')
           );
           currentDistrictForWard = null;
           return;
       }

       if (wardData[selectedProvince] &&
           wardData[selectedProvince][districtCode] &&
           wardData[selectedProvince][districtCode].loaded) {
           ithandechPopulateWardSelect(wardData[selectedProvince][districtCode].data);
           currentDistrictForWard = districtCode;
           ithandechSaveCache();

           $wardSelect.trigger('click');
       } else {
           $.ajax({
               url: ithandech_billing_address_ajax_obj.ajaxurl,
               type: 'POST',
               dataType: 'json',
               data: {
                   action: 'ithandech_load_wards',
                   district_code: districtCode,
                   nonce: ithandech_billing_address_ajax_obj.nonce
               },
               beforeSend: function() {
                // Hiển thị "Đang tải..." trên select Xã/Phường
                $wardSelect.empty().append(
                    $('<option></option>').val('').text('Đang tải...')
                );
                $wardSelect.select2('close');
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
                   $wardSelect.trigger('click');
               },
               error: function() {
                   alert('Không thể tải danh sách xã/phường. Vui lòng thử lại!');
               }
           });
       }
      
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
   }

   $wardSelect.on('click', function() {
       popup_address_billing_ward();
   });

   $wardSelect.on('select2:open', function() {
       popup_address_billing_ward();
   });

   /****************************************
    * 5) SỰ KIỆN HIỂN THỊ TOOLTIP LỖI (checkout_error)
    ****************************************/
   $(document.body).on('checkout_error', function() {
       let $noticeGroup = $('.woocommerce-NoticeGroup-checkout .woocommerce-error.message-wrapper');
       if ($noticeGroup.length) {
           // Ẩn mọi tooltip cũ
           $('span.error').hide();

           let errorFields = [];
           $noticeGroup.find('li[data-id]').each(function(){
               let fieldId = $(this).data('id');
               let $field = $('[name="' + fieldId + '"]');
               if ($field.length) {
                   $field.closest('.input-container').find('span.error').show();
                   errorFields.push($field);
               }
           });

           if (errorFields.length > 0) {
               $('html, body').animate(
                   { scrollTop: errorFields[0].offset().top - 50 },
                   400,
                   function(){
                       errorFields[0].focus();
                   }
               );
           }
       }
   });

   /****************************************
    * 6) ẨN TOOLTIP KHI FOCUS / CHANGE
    ****************************************/
   $('#billing_last_name, #billing_province_code, #billing_district_code, #billing_ward_code, #billing_address_2, #billing_phone, #billing_email')
       .on('focus change', function() {
           $(this).closest('.input-container').find('span.error').hide();
       });

   /**
    * Chỉ tải data Quận/Huyện vào provinceDistrictData 
    * nếu chưa có - KHÔNG đổ vào select.
    */
   function preLoadDistrictData(provinceCode) {
       
       if (!provinceCode) return;

       // Kiểm tra nếu đã load và cache => không cần AJAX lại
       if (provinceDistrictData[provinceCode] && provinceDistrictData[provinceCode].loaded) {
           return;
       }

       // Gọi Ajax
       $.ajax({
           url: ithandech_billing_address_ajax_obj.ajaxurl,
           type: 'POST',
           dataType: 'json',
           data: {
               action: 'ithandech_load_districts',
               province_code: provinceCode
           },
           success: function(response) {
               // Lưu vào provinceDistrictData
               provinceDistrictData[provinceCode] = {
                   loaded: true,
                   data: response
               };
               // Lưu localStorage (nếu muốn)
               ithandechSaveCache();
           },
           error: function() {
               alert('Không thể tải danh sách quận/huyện. Vui lòng thử lại!');
           }
       });
   }

   /****************************************
    * 7) TỰ ĐỘNG LOAD QUẬN/HUYỆN CHO TỈNH NẾU ĐÃ CÓ GIÁ TRỊ
    ****************************************/
   let defaultProvinceCode = $provinceSelect.val();
   if (defaultProvinceCode) {
       // Đừng gọi loadDistrictsByProvince() nữa,
       // thay bằng preLoadDistrictData() để chỉ tải và cache
       preLoadDistrictData(defaultProvinceCode);
   }

    // Khi focus vào một input hiển thị label
    let inputs = $('.woocommerce-billing-fields__field-wrapper input');
    inputs.on('focus', function() {
        $(this).closest('.wc__form-field').find('label').show();
    });

    // Khi mất focus khỏi input ẩn label
    inputs.on('blur', function() {
        $(this).closest('.wc__form-field').find('label').hide();
    });

    /****************************************
     * 8) Thông báo lỗi
     ****************************************/
    function PushMessage(notification) {
        setTimeout(function () {
            notification.classList.remove("display__none");
            notification.classList.add("in");
        }, 100);

        setTimeout(function () {
            hideNotification(notification);
        }, 15000);

        notification.addEventListener("transitionend", function () {
            if (!notification.classList.contains("in")) {
                notification.classList.add("display__none");
            }
        });
    }

    function hideNotification(notification) {
        notification.classList.remove("in");
        notification.classList.add("out");
        notification.classList.add("display__none");
    }

    function showNotifications() {
        const container = document.querySelector('.toast__panel-container');
        const hasRun = container ? container.getAttribute('data-has-run-message') === 'true' : false;

        if (hasRun) return; // Nếu đã chạy thì không tiếp tục duyệt qua các notifications

        const notifications = document.querySelectorAll('.notification');

        if (notifications.length > 0) {
            notifications.forEach((notification, index) => {
                setTimeout(function () {
                    PushMessage(notification);
                }, index * 1000); // Hiển thị lần lượt mỗi notification sau 1 giây
            });

            // Cập nhật giá trị data-has-run-message sau khi chạy xong
            if (container) {
                container.setAttribute('data-has-run-message', 'true');
            }
        } else {
            // Nếu không có phần tử nào, kiểm tra lại sau 1 giây
            setTimeout(showNotifications, 1000);
        }
    }

    setTimeout(function () {
        showNotifications();
    }, 1000); // Bắt đầu sau 2 giây

    // Bắt sự kiện submit của form
    const checkoutForm = document.querySelector('form[name="checkout"]');
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", function() {
            // Đặt lại giá trị data-has-run-message khi form được submit
            const container = document.querySelector('.toast__panel-container');
            if (container) {
                container.setAttribute('data-has-run-message', 'false');

                showNotifications();
            }
        });
    }

    $(document).on('click', '.notification', function() {
        this.classList.add("display__none");
    });

}); // End of jQuery(document).ready
