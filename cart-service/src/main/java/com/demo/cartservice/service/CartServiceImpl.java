package com.demo.cartservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.Cart;
import com.demo.cartservice.mapper.CartMapper;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CartServiceImpl extends ServiceImpl<CartMapper, Cart> implements ICartService {
    @Override
    public List<Cart> getCartByUserId(Long userId) {
        return this.list(new LambdaQueryWrapper<Cart>().eq(Cart::getUserId, userId));
    }

    @Override
    public void clearCart(Long userId, Long merchantId) {
        this.remove(new LambdaQueryWrapper<Cart>()
                .eq(Cart::getUserId, userId)
                .eq(Cart::getMerchantId, merchantId));
    }
}