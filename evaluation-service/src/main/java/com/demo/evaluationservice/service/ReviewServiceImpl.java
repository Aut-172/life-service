package com.demo.evaluationservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.Review;
import com.demo.evaluationservice.mapper.ReviewMapper;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ReviewServiceImpl extends ServiceImpl<ReviewMapper, Review> implements IReviewService {
    @Override
    public List<Review> getReviewsByMerchantId(Long merchantId) {
        return this.list(new LambdaQueryWrapper<Review>().eq(Review::getMerchantId, merchantId));
    }

    @Override
    public List<Review> getReviewsByProductId(Long productId) {
        return this.list(new LambdaQueryWrapper<Review>().eq(Review::getProductId, productId));
    }
}