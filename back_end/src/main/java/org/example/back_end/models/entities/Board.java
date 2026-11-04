package org.example.back_end.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.example.back_end.models.constants.BoardVisibility;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "boards")
@Getter
@Setter
@NoArgsConstructor
public class Board {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "background_url", length = 255)
    private String backgroundUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BoardVisibility visibility = BoardVisibility.PRIVATE;

    @Column(name = "is_starred", nullable = false)
    private boolean starred = false;

    @OneToMany(mappedBy = "board")
    private List<BoardMember> members = new ArrayList<>();

    @OneToMany(mappedBy = "board")
    private List<ListEntity> lists = new ArrayList<>();

    @OneToMany(mappedBy = "board")
    private List<Label> labels = new ArrayList<>();

    @OneToMany(mappedBy = "board")
    private List<ActivityLog> activityLogs = new ArrayList<>();
}
