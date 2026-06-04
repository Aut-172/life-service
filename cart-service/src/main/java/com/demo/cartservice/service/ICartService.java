package com.demo.cartservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.Cart;
import java.util.List;

public interface ICartService extends IService<Cart> {
    List<Cart> getCartByUserId(Long userId);
    void clearCart(Long userId, Long merchantId);
}