'use strict';

var storeLocator = require('base/storeLocator/storeLocator');

/**
 * Restores Quantity Selector to its original state.
 * @param {HTMLElement} $quantitySelect - The Quantity Select Element
 */
function restoreQuantityOptions($quantitySelect) {
    var originalHTML = $quantitySelect.data('originalHTML');
    if (originalHTML) {
        $quantitySelect.html(originalHTML);
    }
}

/**
 * Sets the data attribute of Quantity Selector to save its original state.
 * @param {HTMLElement} $quantitySelect - The Quantity Select Element
 */
function setOriginalQuantitySelect($quantitySelect) {
    if (!$quantitySelect.data('originalHTML')) {
        $quantitySelect.data('originalHTML', $quantitySelect.html());
    } // If it's already there, don't re-set it
}

/**
 * Updates the Quantity Selector based on the In Store Quantity.
 * @param {string} quantitySelector - Quantity Selector
 * @param {string} quantityOptionSelector - Quantity Option Selector
 * @param {number} productAtsValue - Inventory in the selected store
 */
function updateQOptions(quantitySelector, quantityOptionSelector, productAtsValue) {
    var selectedQuantity = $(quantitySelector).val();
    restoreQuantityOptions($(quantitySelector));
    for (var i = $(quantityOptionSelector).length - 1; i >= productAtsValue; i--) {
        $(quantityOptionSelector).eq(i).remove();
    }
    $(quantitySelector + ' option[value="' + selectedQuantity + '"]').attr('selected', 'selected');
}

/**
 * Generates the modal window on the first call.
 */
function getModalHtmlElement() {
    if ($('#inStoreInventoryModal').length !== 0) {
        $('#inStoreInventoryModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal " id="inStoreInventoryModal" role="dialog">'
        + '<div class="modal-dialog in-store-inventory-dialog">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header justify-content-end">'
        + '    <button type="button" class="close pull-right" data-dismiss="modal" title="'
        + $('.btn-get-in-store-inventory').data('modal-close-text') + '">'    // eslint-disable-line
        + '        &times;'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
    $('#inStoreInventoryModal').modal('show');
}

/**
 * Replaces the content in the modal window with find stores components and
 * the result store list.
 * @param {string} pid - The product ID to search for
 * @param {number} quantity - Number of products to search inventory for
 * @param {number} selectedPostalCode - The postal code to search for inventory
 * @param {number} selectedRadius - The radius to search for inventory
 */
function fillModalElement(pid, quantity, selectedPostalCode, selectedRadius) {
    var requestData = {
        products: pid + ':' + quantity
    };

    if (selectedRadius) {
        requestData.radius = selectedRadius;
    }

    if (selectedPostalCode) {
        requestData.postalCode = selectedPostalCode;
    }

    $('#inStoreInventoryModal').spinner().start();
    $.ajax({
        url: $('.btn-get-in-store-inventory').data('action-url'),
        data: requestData,
        method: 'GET',
        success: function (response) {
            $('.modal-body').empty();
            $('.modal-body').html(response.storesResultsHtml);
            storeLocator.search();
            storeLocator.changeRadius();
            storeLocator.selectStore();
            storeLocator.updateSelectStoreButton();

            $('.btn-storelocator-search').attr('data-search-pid', pid);

            if (selectedRadius) {
                $('#radius').val(selectedRadius);
            }

            if (selectedPostalCode) {
                $('#store-postal-code').val(selectedPostalCode);
            }

            if (!$('.results').data('has-results')) {
                $('.store-locator-no-results').show();
            }

            $('#inStoreInventoryModal').modal('show');
            $('#inStoreInventoryModal').spinner().stop();
        },
        error: function () {
            $('#inStoreInventoryModal').spinner().stop();
        }
    });
}

/**
 * Remove the selected store.
 * @param {HTMLElement} $container - the target html element
 */
function deselectStore($container) {
    var storeElement = $($container).find('.selected-store-with-inventory');
    $(storeElement).attr('data-status', 'deselect');
    $(storeElement).addClass('display-none');
    $($container).find('.quantity-select').removeData('originalHTML');
    ToggleCheckMark($($container).find('.btn-get-in-store-inventory'), $($container).find('.btn-get-ship-to-home'));
}

/**
 * Remove the selected store and reset the "Ship to Home" button&"Store Pickup: Select Store" button to default status.
 * @param {HTMLElement} $container - the target html element
 */
function resetStore($container) {
    var storeElement = $($container).find('.selected-store-with-inventory');
    $(storeElement).removeAttr('data-search-pid');
    $(storeElement).find('.card-body').empty();
    $(storeElement).addClass('display-none');
    $($container).find('.quantity-select').removeData('originalHTML');
    ToggleCheckMark($($container).find('.btn-get-in-store-inventory'), $($container).find('.btn-get-ship-to-home'));
}

/**
 * Re-select "Store Pickup: Select Store" button and there is already a selected store.
 * @param {HTMLElement} $storeElement - the target html element
 * @param {HTMLElement} $selectedStoreElement - the target html element
 */
function reSelectStore($storeElement, $selectedStoreElement) {
    var searchPID = $($selectedStoreElement).attr('data-search-pid');
    var storeID = $($selectedStoreElement).find('.store-name').attr('data-store-id');
    $($selectedStoreElement).removeClass('display-none');
    $($selectedStoreElement).removeAttr('data-status');
    updateQuantityOptions(searchPID, storeID, true);
    ToggleCheckMark($($storeElement).find('.btn-get-ship-to-home'), $($storeElement).find('.btn-get-in-store-inventory'));
}

/**
 * Toggle the check mark between checked and unchecked on a lick.
 * @param {HTMLElement} $uncheckElement - the target html element
 * @param {HTMLElement} $checkElement - the target html element
 */
function ToggleCheckMark($uncheckElement, $checkElement) {
    $($uncheckElement).attr('data-bopis-status', '');
    $($uncheckElement).children('i').eq(0).removeClass('fa-check-circle')
        .addClass('fa-circle-o');
    $($checkElement).attr('data-bopis-status', 'selected');
    $($checkElement).children('i').eq(0).removeClass('fa-circle-o')
        .addClass('fa-check-circle');
}

/**
 * Update quantity options. Only display quantity options that are available for the store.
 * @param {string} searchPID - The product ID of the selected product.
 * @param {number} storeId - The store ID selected for in store pickup.
 * @param {boolean} needSpinner - Whether to display a spinner on the page.
 */
function updateQuantityOptions(searchPID, storeId, needSpinner) {
    var selectorPrefix = '.product-detail[data-pid="' + searchPID + '"]';
    var productIdSelector = selectorPrefix + ' .product-id';
    var quantitySelector = selectorPrefix + ' .quantity-select';
    var quantityOptionSelector = quantitySelector + ' option';

    setOriginalQuantitySelect($(quantitySelector));

    var requestData = {
        pid: $(productIdSelector).text(),
        quantitySelected: $(quantitySelector).val(),
        storeId: storeId
    };

    if (needSpinner) {
        $.spinner().start();
    }
    $.ajax({
        url: $('.btn-get-in-store-inventory').data('ats-action-url'),
        data: requestData,
        method: 'GET',
        success: function (response) {
            // Update Quantity dropdown, Remove quantity greater than inventory
            var productAtsValue = response.atsValue;
            var availabilityValue = '';

            var $productContainer = $('.product-detail[data-pid="' + searchPID + '"]');

            if (!response.product.readyToOrder) {
                availabilityValue = '<div>' + response.resources.info_selectforstock + '</div>';
            } else {
                response.product.messages.forEach(function (message) {
                    availabilityValue += '<div>' + message + '</div>';
                });
            }

            $($productContainer).trigger('product:updateAvailability', {
                product: response.product,
                $productContainer: $productContainer,
                message: availabilityValue,
                resources: response.resources
            });

            $('button.add-to-cart, button.add-to-cart-global, button.update-cart-product-global').trigger('product:updateAddToCart', {
                product: response.product, $productContainer: $productContainer
            });

            updateQOptions(quantitySelector, quantityOptionSelector, productAtsValue);
            if (needSpinner) {
                $.spinner().stop();
            }
        },
        error: function () {
            if (needSpinner) {
                $.spinner().stop();
            }
        }
    });
}

/**
 * Return a cookie value by name.
 *
 * @param {string} name - cookie name.
 * @returns {string} cookie value.
 */
function getCookieByName(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return '';
}

/**
 * Open the modal for finding stores.
 *
 * @param {HTMLElement} storeElement - cookie name.
 * @param {Event} event - cookie name.
 */
function openFindStoresModal(storeElement, event) {
    var pid = storeElement.attr('data-pid');
    var quantity = storeElement.find('.quantity-select').val();
    getModalHtmlElement();
    fillModalElement(pid, quantity);
    event.stopPropagation();
}

module.exports = {
    updateSelectStore: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            $('.btn-get-in-store-inventory', response.$productContainer).attr('disabled', (!response.product.readyToOrder || !response.product.available));
        });
    },
    updateSelectedStoreOnAttributeChange: function () {
        $('body').on('product:afterAttributeSelect', function (e, response) {
            response.container.attr('data-pid', response.data.product.id);
            var selectedStore = response.container.find('.selected-store-with-inventory');
            var myStoreId = getCookieByName('mySelectedStoreId');
            if (typeof selectedStore.attr('data-status') === 'undefined' || selectedStore.attr('data-status') === false) {
                if (myStoreId) {
                    var requestData = {
                        pid: response.data.product.id,
                        storeId: myStoreId
                    };
                    $.ajax({
                        url: $('.btn-get-in-store-inventory').data('getmystore-action-url'),
                        data: requestData,
                        method: 'GET',
                        success: function (myStoreResponse) {
                            if (Object.hasOwn(myStoreResponse, 'storeHtml')) {
                                selectedStore.attr('data-search-pid', response.data.product.id);
                                selectedStore.find('.card-body').empty();
                                selectedStore.find('.card-body').append(myStoreResponse.storeHtml);
                                selectedStore.find('.store-name').attr('data-store-id', myStoreId);
                            } else {
                                $('.availability-msg', response.container).empty().html(myStoreResponse.infoSelectForStock);
                                resetStore(response.container);
                            }
                        }
                    });
                } else {
                    resetStore(response.container);
                }
            } else if (selectedStore.attr('data-status') === 'deselect') {
                selectedStore.removeAttr('data-status');
            }
        });
    },
    updateAddToCartFormData: function () {
        $('body').on('updateAddToCartFormData', function (e, form) {
            if (form.pidsObj) {
                var pidsObj = JSON.parse(form.pidsObj);
                pidsObj.forEach(function (product) {
                    var productDetailElement = $('.product-detail[data-pid="' + product.pid + '"]');
                    if (productDetailElement.find('.btn-get-in-store-inventory').attr('data-bopis-status') === 'selected') {
                        var storeElement = productDetailElement.find('.store-name');
                        product.storeId = $(storeElement).length// eslint-disable-line no-param-reassign
                            ? $(storeElement).attr('data-store-id')
                            : null;
                    } else {
                        product.storeId = null;
                    }
                });

                form.pidsObj = JSON.stringify(pidsObj);// eslint-disable-line no-param-reassign
            }

            var storeElement = $('.product-detail[data-pid="'
                + form.pid
                + '"]');

            if ($(storeElement).length) {
                if ($(storeElement).find('.btn-get-in-store-inventory').attr('data-bopis-status') === 'selected') {
                    form.storeId = $(storeElement).find('.store-name') // eslint-disable-line
                        .attr('data-store-id');
                }
            }
        });
    },
    showInStoreInventory: function () {
        $('.btn-get-in-store-inventory').on('click', function (e) {
            if ($(this).children('i').eq(0).hasClass('fa-check-circle')) {
                return;
            }
            var storeElement = $(this).closest('.product-detail');
            var selectedStoreElement = $(storeElement).find('.selected-store-with-inventory');
            if (typeof selectedStoreElement.attr('data-search-pid') !== 'undefined' && selectedStoreElement.attr('data-search-pid') !== false) {
                reSelectStore(storeElement, selectedStoreElement);
                return;
            }
            var myStoreId = getCookieByName('mySelectedStoreId');
            $.spinner().start();
            if (myStoreId || !navigator.geolocation) {
                $.spinner().stop();
                openFindStoresModal(storeElement, e);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    var requestData = {
                        pid: storeElement.attr('data-pid'),
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    $.ajax({
                        url: $('.btn-get-in-store-inventory').data('getstorebycoords-action-url'),
                        data: requestData,
                        method: 'GET',
                        success: function (myStoreResponse) {
                            if (Object.hasOwn(myStoreResponse, 'storeHtml')) {
                                selectedStoreElement.attr('data-search-pid', storeElement.attr('data-pid'));
                                selectedStoreElement.find('.card-body').empty();
                                selectedStoreElement.find('.card-body').append(myStoreResponse.storeHtml);
                                selectedStoreElement.find('.store-name').attr('data-store-id', myStoreResponse.storeId);
                                updateQuantityOptions(storeElement.attr('data-pid'), myStoreResponse.storeId, false);
                                document.cookie = 'mySelectedStoreId=' + myStoreResponse.storeId + '; max-age=86400; SameSite=Strict; Secure; path=/';
                                ToggleCheckMark($(storeElement).find('.btn-get-ship-to-home'), $(storeElement).find('.btn-get-in-store-inventory'));
                                selectedStoreElement.removeClass('display-none');
                                $.spinner().stop();
                            } else {
                                $.spinner().stop();
                                openFindStoresModal(storeElement, e);
                            }
                        },
                        error: function (request, status, error) {
                            $.spinner().stop();
                            openFindStoresModal(storeElement, e);
                        }
                    });
                },
                function (error) {
                    $.spinner().stop();
                    openFindStoresModal(storeElement, e);
                },
                { timeout: 1000, enableHighAccuracy: false }
            );
        });
    },
    removeStoreSelection: function () {
        $('body').on('click', '#remove-store-selection, .btn-get-ship-to-home', (function () {
            var storeElement = $(this).closest('.product-detail');
            deselectStore(storeElement);
            $(document).trigger('store:afterRemoveStoreSelection', $(storeElement).find('.quantity-select'));
        }));
    },
    selectStoreWithInventory: function () {
        $('body').on('store:selected', function (e, data) {
            var searchPID = $('.btn-storelocator-search').attr('data-search-pid');
            var storeElement = $('.product-detail[data-pid="' + searchPID + '"]');
            $(storeElement).find('.selected-store-with-inventory').attr('data-search-pid', searchPID);
            $(storeElement).find('.selected-store-with-inventory .card-body').empty();
            $(storeElement).find('.selected-store-with-inventory .card-body').append(data.storeDetailsHtml);
            $(storeElement).find('.store-name').attr('data-store-id', data.storeID);
            $(storeElement).find('.selected-store-with-inventory').removeClass('display-none');

            var $changeStoreButton = $(storeElement).find('.change-store');
            $($changeStoreButton).data('postal', data.searchPostalCode);
            $($changeStoreButton).data('radius', data.searchRadius);

            updateQuantityOptions(searchPID, data.storeID, false);

            document.cookie = 'mySelectedStoreId=' + data.storeID + '; max-age=86400; SameSite=Strict; Secure; path=/';

            ToggleCheckMark($(storeElement).find('.btn-get-ship-to-home'), $(storeElement).find('.btn-get-in-store-inventory'));

            $('#inStoreInventoryModal').modal('hide');
            $('#inStoreInventoryModal').remove();
        });
    },
    changeStore: function () {
        $('body').on('click', '.change-store', (function () {
            var pid = $(this).closest('.product-detail').attr('data-pid');
            var quantity = $(this).closest('.product-detail').find('.quantity-select').val();
            getModalHtmlElement();
            fillModalElement(pid, quantity, $(this).data('postal'), $(this).data('radius'));
        }));
    }
};
