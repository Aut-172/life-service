package com.demo.cartservice.controller;

import com.demo.common.dto.Response;
import com.demo.common.entity.Cart;
import com.demo.cartservice.service.ICartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cart")
public class CartController {

    @Autowired
    private ICartService cartService;

    @GetMapping
    public Response<List<Cart>> getCart() {
        Long userId = getCurrentUserId();
        return Response.success(cartService.getCartByUserId(userId));
    }

    @PostMapping
    public Response<Boolean> addToCart(@RequestBody Cart cart) {
        cart.setUserId(getCurrentUserId());
        // 如果已存在则增加数量，否则新增
        return Response.success(cartService.saveOrUpdate(cart));
    }

    @PutMapping("/quantity")
    public Response<Boolean> updateQuantity(@RequestParam Long cartItemId, @RequestParam Integer quantity) {
        Cart cart = cartService.getById(cartItemId);
        cart.setQuantity(quantity);
        return Response.success(cartService.updateById(cart));
    }

    @DeleteMapping("/{cartItemId}")
    public Response<Boolean> removeFromCart(@PathVariable Long cartItemId) {
        return Response.success(cartService.removeById(cartItemId));
    }

    @DeleteMapping("/clear/{merchantId}")
    public Response<Boolean> clearCart(@PathVariable Long merchantId) {
        Long userId = getCurrentUserId();
        cartService.clearCart(userId, merchantId);
        return Response.success(true);
    }

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}