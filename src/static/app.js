document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // Bust caches to ensure UI shows the latest data after mutations
      const response = await fetch(`/activities`, { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message and UI states
      activitiesList.innerHTML = "";
      // Reset the select dropdown to only the default option
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        // Add data attribute so other parts of the UI can target this card
        activityCard.setAttribute("data-activity-name", name);

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Add participants section
        if (details.participants && details.participants.length > 0) {
          const participantsHeader = document.createElement("p");
          participantsHeader.className = "participants-header";
          participantsHeader.innerHTML = "<strong>Participants:</strong>";
          activityCard.appendChild(participantsHeader);

          const ul = document.createElement("ul");
          ul.className = "participants-list";
          details.participants.forEach((participant) => {
            const li = document.createElement("li");
            li.className = "participant";

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = participant;

            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "participant-delete";
            deleteBtn.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
            deleteBtn.textContent = "✖";

            deleteBtn.addEventListener("click", async (e) => {
              e.preventDefault();
              // Basic confirmation
              const confirmDelete = confirm(`Unregister ${participant} from ${name}?`);
              if (!confirmDelete) return;

              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`,
                  {
                    method: "DELETE",
                  }
                );

                const result = await response.json();

                if (response.ok) {
                  messageDiv.textContent = result.message;
                  messageDiv.className = "success";
                  // Refresh UI after successful unregister
                  await fetchActivities();
                } else {
                  messageDiv.textContent = result.detail || "Failed to unregister participant";
                  messageDiv.className = "error";
                }
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 5000);
              } catch (err) {
                messageDiv.textContent = "Failed to unregister participant. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                console.error("Error unregistering participant:", err);
              }
            });

            li.appendChild(emailSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });
          activityCard.appendChild(ul);
        } else {
          const noParticipants = document.createElement("p");
          noParticipants.className = "no-participants";
          noParticipants.textContent = "No participants yet";
          activityCard.appendChild(noParticipants);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh UI after successful signup and highlight the updated activity
        await fetchActivities();
        // Find the exact card by matching the data attribute value (safer than querySelector when names contain special chars)
        const updatedCard = Array.from(document.querySelectorAll('[data-activity-name]')).find(
          (c) => c.getAttribute('data-activity-name') === activity
        );
        if (updatedCard) {
          updatedCard.classList.add('highlight');
          setTimeout(() => updatedCard.classList.remove('highlight'), 1500);
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
