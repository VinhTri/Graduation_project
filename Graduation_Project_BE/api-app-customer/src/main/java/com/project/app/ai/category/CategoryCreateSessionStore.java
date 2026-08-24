package com.project.app.ai.category;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.project.app.ai.entity.AiCategoryDraftEntity;
import com.project.app.ai.repository.AiCategoryDraftRepository;
import lombok.RequiredArgsConstructor;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CategoryCreateSessionStore {

    private static final Duration TTL = Duration.ofMinutes(15);

    private final AiCategoryDraftRepository repository;

    @Transactional
    public void save(Long userId, CategoryCreateDraft draft) {
        if (userId == null || draft == null) {
            return;
        }
        AiCategoryDraftEntity entity=repository.findByUserId(userId).orElseGet(AiCategoryDraftEntity::new);
        entity.setUserId(userId); entity.setLabel(draft.getLabel()); entity.setGroupId(draft.getGroupId());
        entity.setGroupTitle(draft.getGroupTitle()); entity.setIcon(draft.getIcon()); entity.setColor(draft.getColor());
        entity.setBgColor(draft.getBgColor()); entity.setExpiresAt(Instant.now().plus(TTL)); repository.save(entity);
    }

    @Transactional
    public Optional<CategoryCreateDraft> get(Long userId) {
        if (userId == null) {
            return Optional.empty();
        }
        Optional<AiCategoryDraftEntity> found=repository.findByUserId(userId);
        if(found.isEmpty()) return Optional.empty();
        AiCategoryDraftEntity entity=found.get();
        if(entity.getExpiresAt().isBefore(Instant.now())){ repository.delete(entity); return Optional.empty(); }
        return Optional.of(CategoryCreateDraft.builder().label(entity.getLabel()).groupId(entity.getGroupId())
                .groupTitle(entity.getGroupTitle()).icon(entity.getIcon()).color(entity.getColor())
                .bgColor(entity.getBgColor()).createdAt(Instant.now()).build());
    }

    @Transactional
    public void clear(Long userId) {
        if (userId != null) {
            repository.deleteByUserId(userId);
        }
    }
}
