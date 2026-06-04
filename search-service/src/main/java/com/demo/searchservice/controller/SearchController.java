package com.demo.searchservice.controller;

import com.demo.common.dto.Response;
import com.demo.common.entity.Merchant;
import com.demo.common.entity.Product;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/search")
public class SearchController {

    @Autowired
    private RestTemplate restTemplate;  // 或使用Feign

    // 简单搜索：同时搜商家和商品，返回合并结果（模拟）
    @GetMapping
    public Response<SearchResult> search(@RequestParam String keyword) {
        // 实际应调用merchant-service和product-service的接口，这里模拟
        List<Merchant> merchants = new ArrayList<>();
        List<Product> products = new ArrayList<>();

        // 模拟数据
        if (keyword.contains("餐厅")) {
            Merchant m = new Merchant();
            m.setMerchantName("美味餐厅");
            merchants.add(m);
        }
        if (keyword.contains("汉堡")) {
            Product p = new Product();
            p.setProductName("巨无霸汉堡");
            products.add(p);
        }

        SearchResult result = new SearchResult(merchants, products);
        return Response.success(result);
    }

    // 仅搜索商家
    @GetMapping("/merchant")
    public Response<List<Merchant>> searchMerchant(@RequestParam String keyword) {
        // 调用merchant-service的接口
        return Response.success(new ArrayList<>());
    }

    // 仅搜索商品
    @GetMapping("/product")
    public Response<List<Product>> searchProduct(@RequestParam String keyword) {
        return Response.success(new ArrayList<>());
    }

    static class SearchResult {
        private List<Merchant> merchants;
        private List<Product> products;
        public SearchResult(List<Merchant> merchants, List<Product> products) {
            this.merchants = merchants;
            this.products = products;
        }
        // getter/setter省略
    }
}