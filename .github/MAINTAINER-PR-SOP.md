# Maintainer SOP: External PR Handling in VS Code

## Purpose

Use this process when a contributor PR needs maintainer follow-up changes, while keeping branch protection and audit trail intact.

## Tools

- VS Code Source Control
- GitHub Pull Requests extension
- GitLens extension

## Standard Flow

1. Open the contributor PR in VS Code.
2. Check out the PR branch from the Pull Requests view.
3. Create a new maintainer branch from that PR branch.
4. Implement and validate fixes.
5. Commit and publish the branch.
6. Open a follow-up PR.
7. Request approval and merge through PR UI.
8. Close superseded PRs with linked context.

## Detailed Steps

1. In Pull Requests view, open the contributor PR and choose Checkout.
2. In the branch picker, create a branch from the current branch.
3. Name branch clearly, for example: `fix/pr-64-compat-fallback`.
4. Make code changes.
5. Use Problems panel and tests/tasks before commit.
6. In Source Control:
   - Stage only intended files.
   - Review diff.
   - Commit with a clear message.
7. Publish the branch to origin.
8. Create PR from VS Code:
   - Base branch: `master`
   - Title: Follow-up for PR #X
   - Body: what changed, why, risk, validation
9. Add a reviewer with write access.
10. Merge only after required checks and approvals.
11. Add a closure comment on the contributor PR:

- Link the follow-up PR.
- Link the final merge commit.
- State final disposition.

## GitLens Checkpoints

1. Before commit:
   - Use Commit Graph to confirm your branch starts from the right PR commit.
2. Before opening PR:
   - Compare current branch vs `master` in GitLens.
   - Verify only expected files changed.
3. Before merge:
   - Confirm no unrelated commits are included.

## Do Not Do

- Do not push directly to `master`.
- Do not bypass branch protection unless emergency.
- Do not close contributor PR without explanation and links.
- Do not mix unrelated fixes in the same follow-up PR.

## Emergency Exception

Use direct push only for production incident mitigation. If used:

1. Open an immediate post-facto PR documenting the hotfix.
2. Add an incident note in the original PR thread.
3. Record reason for bypass in repo notes.

## PR Comment Template

Thanks for the contribution. I added a maintainer follow-up for compatibility and opened PR #Y.
Final merged commit is SHA.
This keeps your intent while preserving behavior for legacy device capability sets.
