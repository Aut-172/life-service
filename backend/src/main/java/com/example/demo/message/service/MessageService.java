package com.example.demo.message.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.auth.entity.Merchant;
import com.example.demo.auth.entity.User;
import com.example.demo.auth.mapper.MerchantMapper;
import com.example.demo.auth.mapper.UserMapper;
import com.example.demo.message.dto.MessageVO;
import com.example.demo.message.dto.SendMessageRequest;
import com.example.demo.message.dto.ThreadVO;
import com.example.demo.message.entity.Message;
import com.example.demo.message.mapper.MessageMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 消息服务
 * 支持用户与商家之间的文字消息通讯（HTTP轮询方式）
 */
@Service
public class MessageService {

    private final MessageMapper messageMapper;
    private final UserMapper userMapper;
    private final MerchantMapper merchantMapper;

    public MessageService(MessageMapper messageMapper, UserMapper userMapper, MerchantMapper merchantMapper) {
        this.messageMapper = messageMapper;
        this.userMapper = userMapper;
        this.merchantMapper = merchantMapper;
    }

    /**
     * 发送消息
     */
    @Transactional
    public MessageVO sendMessage(Long senderId, String senderType, SendMessageRequest request) {
        Message message = new Message();
        message.setSenderId(senderId);
        message.setSenderType(senderType);
        message.setReceiverId(request.getReceiverId());
        message.setReceiverType(request.getReceiverType());
        message.setOrderId(request.getOrderId());
        message.setContent(request.getContent());
        message.setIsRead(false);

        messageMapper.insert(message);

        return toMessageVO(message);
    }

    /**
     * 获取会话消息列表
     *
     * @param userId   当前用户ID
     * @param userType 当前用户类型
     * @param targetId 对方ID
     * @param orderId  关联订单ID（可选）
     * @return 消息列表
     */
    public List<MessageVO> getMessages(Long userId, String userType, Long targetId, Long orderId) {
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<Message>()
                .and(w -> w
                        .and(q -> q.eq(Message::getSenderId, userId)
                                .eq(Message::getSenderType, userType)
                                .eq(Message::getReceiverId, targetId))
                        .or(q -> q.eq(Message::getSenderId, targetId)
                                .eq(Message::getReceiverId, userId)
                                .eq(Message::getReceiverType, userType))
                )
                .orderByAsc(Message::getCreateTime);

        // 如果指定了订单ID，按订单过滤
        if (orderId != null) {
            wrapper.eq(Message::getOrderId, orderId);
        }

        List<Message> messages = messageMapper.selectList(wrapper);

        // 将消息标记为已读
        List<Long> unreadIds = messages.stream()
                .filter(m -> !m.getIsRead() && m.getReceiverId().equals(userId))
                .map(Message::getId)
                .collect(Collectors.toList());
        if (!unreadIds.isEmpty()) {
            for (Message msg : messages) {
                if (unreadIds.contains(msg.getId())) {
                    msg.setIsRead(true);
                    messageMapper.updateById(msg);
                }
            }
        }

        return messages.stream().map(this::toMessageVO).collect(Collectors.toList());
    }

    /**
     * 获取会话列表
     *
     * @param userId   当前用户ID
     * @param userType 当前用户类型
     * @return 会话线程列表
     */
    public List<ThreadVO> getThreads(Long userId, String userType) {
        // 查询所有相关的消息
        List<Message> messages = messageMapper.selectList(
                new LambdaQueryWrapper<Message>()
                        .and(w -> w
                                .eq(Message::getSenderId, userId)
                                .eq(Message::getSenderType, userType)
                                .or(q -> q.eq(Message::getReceiverId, userId)
                                        .eq(Message::getReceiverType, userType))
                        )
                        .orderByDesc(Message::getCreateTime)
        );

        // 按对方ID分组
        Map<String, List<Message>> grouped = new LinkedHashMap<>();
        for (Message msg : messages) {
            Long otherId;
            String otherType;
            if (msg.getSenderId().equals(userId) && msg.getSenderType().equals(userType)) {
                otherId = msg.getReceiverId();
                otherType = msg.getReceiverType();
            } else {
                otherId = msg.getSenderId();
                otherType = msg.getSenderType();
            }
            String key = otherType + "_" + otherId;
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(msg);
        }

        List<ThreadVO> threads = new ArrayList<>();
        for (Map.Entry<String, List<Message>> entry : grouped.entrySet()) {
            List<Message> msgs = entry.getValue();
            Message lastMsg = msgs.get(0); // 第一条是最新的（按时间倒序）

            // 获取对方信息
            String[] parts = entry.getKey().split("_");
            String otherType = parts[0];
            Long otherId = Long.parseLong(parts[1]);

            String targetName = "";
            String targetAvatar = "";

            if ("user".equals(otherType)) {
                User user = userMapper.selectById(otherId);
                if (user != null) {
                    targetName = user.getNickname() != null ? user.getNickname() : user.getUsername();
                    targetAvatar = user.getAvatar();
                }
            } else if ("merchant".equals(otherType)) {
                Merchant merchant = merchantMapper.selectById(otherId);
                if (merchant != null) {
                    targetName = merchant.getName();
                    targetAvatar = merchant.getAvatar();
                }
            }

            // 计算未读消息数
            long unreadCount = msgs.stream()
                    .filter(m -> !m.getIsRead() && m.getReceiverId().equals(userId))
                    .count();

            ThreadVO thread = ThreadVO.builder()
                    .targetId(otherId)
                    .targetName(targetName)
                    .targetAvatar(targetAvatar)
                    .lastMessage(lastMsg.getContent())
                    .lastMessageTime(formatTime(lastMsg.getCreateTime()))
                    .unreadCount((int) unreadCount)
                    .build();

            threads.add(thread);
        }

        // 按最后消息时间排序（最新的在前）
        threads.sort((a, b) -> b.getLastMessageTime().compareTo(a.getLastMessageTime()));

        return threads;
    }

    /**
     * 获取未读消息数
     */
    public int getUnreadCount(Long userId, String userType) {
        return messageMapper.selectCount(
                new LambdaQueryWrapper<Message>()
                        .eq(Message::getReceiverId, userId)
                        .eq(Message::getReceiverType, userType)
                        .eq(Message::getIsRead, false)
        ).intValue();
    }

    private MessageVO toMessageVO(Message message) {
        return MessageVO.builder()
                .id(message.getId())
                .senderId(message.getSenderId())
                .senderType(message.getSenderType())
                .receiverId(message.getReceiverId())
                .receiverType(message.getReceiverType())
                .orderId(message.getOrderId())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .createTime(message.getCreateTime())
                .build();
    }

    private String formatTime(LocalDateTime time) {
        if (time == null) return "";
        return time.format(DateTimeFormatter.ofPattern("MM-dd HH:mm"));
    }
}
